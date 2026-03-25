import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { malaysiaPhoneLookupVariants, normalizeMalaysiaMobile } from "@/lib/phone-malaysia";
import { shopCalendarDateString } from "@/lib/shop-day";
import { createAdminClient } from "@/lib/supabase/admin";

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === "23505" || /duplicate key|unique constraint/i.test(err.message ?? "");
}

const bodySchema = z.object({
  token: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  party_size: z.coerce.number().int().min(1).max(20),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { token, full_name, party_size, phone } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Check-in is not available" }, { status: 503 });
  }

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("id, tenant_id, name")
    .eq("checkin_token", token)
    .maybeSingle();

  if (branchError || !branch) {
    return NextResponse.json({ error: "Invalid or expired check-in link" }, { status: 404 });
  }

  const trimmedPhone = phone?.trim() ?? "";
  const useSyntheticPhone = trimmedPhone.length === 0;
  /** Canonical stored phone for real mobiles (E.164-style +60… when possible). */
  const storePhone = useSyntheticPhone
    ? `walk-in-${randomUUID().slice(0, 12)}`
    : normalizeMalaysiaMobile(trimmedPhone) || trimmedPhone;

  let customerId: string;

  if (useSyntheticPhone) {
    const { data: inserted, error: custError } = await admin
      .from("customers")
      .insert({
        tenant_id: branch.tenant_id,
        branch_id: branch.id,
        full_name,
        phone: storePhone,
        loyalty_points: 0,
      })
      .select("id")
      .single();

    if (custError || !inserted) {
      return NextResponse.json({ error: custError?.message ?? "Could not save your details" }, { status: 500 });
    }
    customerId = inserted.id;
  } else {
    let existingId: string | null = null;
    for (const variant of malaysiaPhoneLookupVariants(trimmedPhone)) {
      const { data: row } = await admin
        .from("customers")
        .select("id")
        .eq("tenant_id", branch.tenant_id)
        .eq("phone", variant)
        .maybeSingle();
      if (row) {
        existingId = row.id;
        break;
      }
    }

    if (existingId) {
      const { error: upErr } = await admin
        .from("customers")
        .update({
          full_name,
          branch_id: branch.id,
          phone: storePhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId);

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      customerId = existingId;
    } else {
      const { data: inserted, error: custError } = await admin
        .from("customers")
        .insert({
          tenant_id: branch.tenant_id,
          branch_id: branch.id,
          full_name,
          phone: storePhone,
          loyalty_points: 0,
        })
        .select("id")
        .single();

      if (inserted) {
        customerId = inserted.id;
      } else if (custError && isUniqueViolation(custError)) {
        let racedId: string | null = null;
        for (const variant of malaysiaPhoneLookupVariants(trimmedPhone)) {
          const { data: row } = await admin
            .from("customers")
            .select("id")
            .eq("tenant_id", branch.tenant_id)
            .eq("phone", variant)
            .maybeSingle();
          if (row) {
            racedId = row.id;
            break;
          }
        }
        if (!racedId) {
          return NextResponse.json({ error: custError.message }, { status: 500 });
        }
        await admin
          .from("customers")
          .update({
            full_name,
            branch_id: branch.id,
            phone: storePhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", racedId);
        customerId = racedId;
      } else {
        return NextResponse.json({ error: custError?.message ?? "Could not save your details" }, { status: 500 });
      }
    }
  }

  const queueDay = shopCalendarDateString();
  let lastTicketError: string | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { count } = await admin
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", branch.tenant_id)
      .eq("branch_id", branch.id)
      .eq("queue_day", queueDay);

    const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

    const { data: ticket, error: ticketError } = await admin
      .from("queue_tickets")
      .insert({
        tenant_id: branch.tenant_id,
        branch_id: branch.id,
        customer_id: customerId,
        queue_number,
        queue_day: queueDay,
        status: "waiting",
        party_size,
      })
      .select("id, queue_number")
      .single();

    if (!ticketError && ticket) {
      return NextResponse.json({
        success: true,
        queue_number: ticket.queue_number,
        branch_name: branch.name,
      });
    }

    lastTicketError = ticketError?.message ?? "Could not join queue";
    if (ticketError && isUniqueViolation(ticketError)) {
      continue;
    }
    return NextResponse.json({ error: lastTicketError }, { status: 500 });
  }

  return NextResponse.json({ error: lastTicketError ?? "Could not join queue" }, { status: 500 });
}
