import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { malaysiaPhoneLookupVariants, normalizeMalaysiaMobile } from "@/lib/phone-malaysia";
import { shopCalendarDateString } from "@/lib/shop-day";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === "23505" || /duplicate key|unique constraint/i.test(err.message ?? "");
}

/**
 * For logged-in users, `customers.phone` stores their account email so queue/bookings line up.
 * We must resolve the email-keyed row first; otherwise we match a different guest row by mobile
 * and updating it to the email violates customers_tenant_id_phone_key.
 */
async function findExistingCustomerForCheckin(
  admin: AdminClient,
  tenantId: string,
  authEmail: string | null,
  trimmedPhone: string,
  canonicalPhone: string
): Promise<{ id: string; matchedAccountEmail: boolean } | null> {
  if (authEmail) {
    const { data: emailRow } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone", authEmail)
      .maybeSingle();
    if (emailRow) return { id: emailRow.id, matchedAccountEmail: true };
  }
  for (const variant of malaysiaPhoneLookupVariants(trimmedPhone)) {
    const { data: row } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone", variant)
      .maybeSingle();
    if (row) return { id: row.id, matchedAccountEmail: false };
  }
  const { data: byCanonical } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone", canonicalPhone)
    .maybeSingle();
  if (byCanonical) {
    return {
      id: byCanonical.id,
      matchedAccountEmail: Boolean(authEmail && canonicalPhone === authEmail),
    };
  }
  return null;
}

const memberServiceSchema = z.object({
  member_index: z.number().int().min(0).max(19),
  service_id: z.string().uuid(),
  service_name: z.string().max(120),
  service_price: z.number().min(0),
});

const bodySchema = z.object({
  token: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  party_size: z.coerce.number().int().min(1).max(20),
  phone: z.string().trim().max(30).optional().nullable(),
  member_services: z.array(memberServiceSchema).max(20).optional().default([]),
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

  const { token, full_name, party_size, phone, member_services } = parsed.data;

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

  // Detect authenticated user server-side — do NOT trust any auth info from the client body
  let authUserEmail: string | null = null;
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (user?.email) authUserEmail = user.email;
  } catch {
    // Not authenticated or session unavailable — continue as guest
  }

  const trimmedPhone = phone?.trim() ?? "";
  // Authenticated users: use their email as the customer phone so tickets appear in /bookings.
  // Guest users: use the provided phone or a synthetic walk-in ID.
  const useSyntheticPhone = !authUserEmail && trimmedPhone.length === 0;
  const storePhone = authUserEmail
    ? authUserEmail
    : useSyntheticPhone
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
    const existing = await findExistingCustomerForCheckin(
      admin,
      branch.tenant_id,
      authUserEmail,
      trimmedPhone,
      storePhone
    );

    if (existing) {
      const updatePayload: {
        full_name: string;
        branch_id: string;
        updated_at: string;
        phone?: string;
      } = {
        full_name,
        branch_id: branch.id,
        updated_at: new Date().toISOString(),
      };
      // Guests: always set canonical phone. Logged-in: only change phone when merging a mobile-only row into the account email.
      if (!authUserEmail) {
        updatePayload.phone = storePhone;
      } else if (!existing.matchedAccountEmail) {
        updatePayload.phone = storePhone;
      }

      const { error: upErr } = await admin.from("customers").update(updatePayload).eq("id", existing.id);

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      customerId = existing.id;
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
        const raced = await findExistingCustomerForCheckin(
          admin,
          branch.tenant_id,
          authUserEmail,
          trimmedPhone,
          storePhone
        );
        if (!raced) {
          return NextResponse.json({ error: custError.message }, { status: 500 });
        }
        const updatePayload: {
          full_name: string;
          branch_id: string;
          updated_at: string;
          phone?: string;
        } = {
          full_name,
          branch_id: branch.id,
          updated_at: new Date().toISOString(),
        };
        if (!authUserEmail) {
          updatePayload.phone = storePhone;
        } else if (!raced.matchedAccountEmail) {
          updatePayload.phone = storePhone;
        }
        const { error: upRace } = await admin.from("customers").update(updatePayload).eq("id", raced.id);
        if (upRace) {
          return NextResponse.json({ error: upRace.message }, { status: 500 });
        }
        customerId = raced.id;
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

    const sanitisedMemberServices = (member_services ?? []).filter(
      (m) => m.member_index < party_size
    );

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
        member_services: sanitisedMemberServices,
      })
      .select("id, queue_number, branch_id")
      .single();

    if (!ticketError && ticket) {
      return NextResponse.json({
        success: true,
        ticket_id: ticket.id,
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
