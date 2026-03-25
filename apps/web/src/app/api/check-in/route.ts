import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { shopDayUtcBounds } from "@/lib/shop-day";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const phoneVal = phone?.trim() || `walk-in-${randomUUID().slice(0, 12)}`;

  const { data: customer, error: custError } = await admin
    .from("customers")
    .insert({
      tenant_id: branch.tenant_id,
      branch_id: branch.id,
      full_name,
      phone: phoneVal,
      loyalty_points: 0,
    })
    .select("id")
    .single();

  if (custError || !customer) {
    return NextResponse.json({ error: custError?.message ?? "Could not save your details" }, { status: 500 });
  }

  const { start, end } = shopDayUtcBounds();

  const { count } = await admin
    .from("queue_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", branch.tenant_id)
    .eq("branch_id", branch.id)
    .gte("created_at", start)
    .lte("created_at", end);

  const queue_number = "Q" + String((count ?? 0) + 1).padStart(4, "0");

  const { data: ticket, error: ticketError } = await admin
    .from("queue_tickets")
    .insert({
      tenant_id: branch.tenant_id,
      branch_id: branch.id,
      customer_id: customer.id,
      queue_number,
      status: "waiting",
      party_size,
    })
    .select("id, queue_number")
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: ticketError?.message ?? "Could not join queue" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    queue_number: ticket.queue_number,
    branch_name: branch.name,
  });
}
