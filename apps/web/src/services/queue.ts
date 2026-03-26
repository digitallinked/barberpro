import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { shopCalendarDateString } from "@/lib/shop-day";

type Client = SupabaseClient<Database>;

/** One person in a group ticket seated at a specific chair with a specific barber and service. */
export type TicketSeatMember = {
  id: string;
  ticket_id: string;
  seat_id: string | null;
  staff_id: string | null;
  service_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  seat: { seat_number: number; label: string } | null;
  staff: { full_name: string } | null;
  service: { name: string; price: number } | null;
};

export type QueueTicketWithRelations = {
  id: string;
  queue_number: string;
  status: string;
  branch_id: string;
  customer_id: string | null;
  service_id: string | null;
  assigned_staff_id: string | null;
  preferred_staff_id: string | null;
  seat_id: string | null;
  estimated_wait_min: number | null;
  party_size: number;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { full_name: string; phone: string } | null;
  assigned_staff: { full_name: string } | null;
  service: { name: string; price: number } | null;
  seat: { seat_number: number; label: string } | null;
  /** Individual seat assignments for group tickets (party_size > 1). */
  ticket_seats: TicketSeatMember[];
};

function mapTicketSeatMember(raw: Record<string, unknown>): TicketSeatMember {
  const seat = raw.branch_seats as Record<string, unknown> | null;
  const staffProfile = raw.staff_profiles as Record<string, unknown> | null;
  const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
  const staffName = Array.isArray(appUser) ? appUser[0] : appUser;
  const service = raw.services as Record<string, unknown> | null;
  return {
    id: raw.id as string,
    ticket_id: raw.ticket_id as string,
    seat_id: raw.seat_id as string | null,
    staff_id: raw.staff_id as string | null,
    service_id: raw.service_id as string | null,
    status: raw.status as string,
    started_at: raw.started_at as string | null,
    completed_at: raw.completed_at as string | null,
    created_at: raw.created_at as string,
    seat: seat ? { seat_number: seat.seat_number as number, label: seat.label as string } : null,
    staff: staffName ? { full_name: (staffName as Record<string, unknown>).full_name as string } : null,
    service: service ? { name: service.name as string, price: Number(service.price ?? 0) } : null,
  };
}

function mapQueueTicket(row: Record<string, unknown>): QueueTicketWithRelations {
  const customer = row.customers as Record<string, unknown> | null;
  const staffProfile = row.staff_profiles as Record<string, unknown> | null;
  const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
  const staffName = Array.isArray(appUser) ? appUser[0] : appUser;
  const service = row.services as Record<string, unknown> | null;
  const seat = row.branch_seats as Record<string, unknown> | null;
  const rawSeats = row.queue_ticket_seats as Record<string, unknown>[] | null;

  return {
    id: row.id as string,
    queue_number: row.queue_number as string,
    status: row.status as string,
    branch_id: row.branch_id as string,
    customer_id: row.customer_id as string | null,
    service_id: row.service_id as string | null,
    assigned_staff_id: row.assigned_staff_id as string | null,
    preferred_staff_id: row.preferred_staff_id as string | null,
    seat_id: row.seat_id as string | null,
    estimated_wait_min: row.estimated_wait_min as number | null,
    party_size: typeof row.party_size === "number" ? row.party_size : 1,
    called_at: row.called_at as string | null,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    customer: customer
      ? { full_name: customer.full_name as string, phone: customer.phone as string }
      : null,
    assigned_staff: staffName
      ? { full_name: (staffName as Record<string, unknown>).full_name as string }
      : null,
    service: service ? { name: service.name as string, price: Number(service.price ?? 0) } : null,
    seat: seat ? { seat_number: seat.seat_number as number, label: seat.label as string } : null,
    ticket_seats: (rawSeats ?? []).map(mapTicketSeatMember),
  };
}

/** Fetch all queue_ticket_seats for a set of ticket IDs, with their related seat/staff/service. */
async function fetchTicketSeatsMap(
  client: Client,
  ticketIds: string[]
): Promise<Map<string, TicketSeatMember[]>> {
  const map = new Map<string, TicketSeatMember[]>();
  if (ticketIds.length === 0) return map;

  // Fetch seat members with nested joins for seat, staff, and service.
  const { data, error } = await client
    .from("queue_ticket_seats")
    .select(
      `id, ticket_id, seat_id, staff_id, service_id, status, started_at, completed_at, created_at,
       branch_seats (seat_number, label),
       staff_profiles (app_users (full_name)),
       services (name, price)`
    )
    .in("ticket_id", ticketIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  if (!error && data) {
    for (const raw of data as Record<string, unknown>[]) {
      const member = mapTicketSeatMember(raw);
      const existing = map.get(member.ticket_id) ?? [];
      existing.push(member);
      map.set(member.ticket_id, existing);
    }
    return map;
  }

  // Fallback: fetch without joins, then resolve seat/staff/service separately.
  const { data: base } = await client
    .from("queue_ticket_seats")
    .select("id, ticket_id, seat_id, staff_id, service_id, status, started_at, completed_at, created_at")
    .in("ticket_id", ticketIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  if (!base) return map;

  const seatIds = [...new Set(base.map((r) => (r as Record<string, unknown>).seat_id as string | null).filter(Boolean) as string[])];
  const memberStaffIds = [...new Set(base.map((r) => (r as Record<string, unknown>).staff_id as string | null).filter(Boolean) as string[])];
  const serviceIds = [...new Set(base.map((r) => (r as Record<string, unknown>).service_id as string | null).filter(Boolean) as string[])];

  const seatMap = new Map<string, { seat_number: number; label: string }>();
  if (seatIds.length > 0) {
    const { data: seats } = await client.from("branch_seats").select("id, seat_number, label").in("id", seatIds);
    for (const s of seats ?? []) seatMap.set(s.id, { seat_number: s.seat_number, label: s.label });
  }

  const memberStaffMap = new Map<string, string>();
  if (memberStaffIds.length > 0) {
    const { data: staffRows } = await client.from("staff_profiles").select("id, app_users (full_name)").in("id", memberStaffIds);
    for (const s of staffRows ?? []) {
      const au = (s as Record<string, unknown>).app_users as Record<string, unknown> | Record<string, unknown>[] | null;
      const appUser = Array.isArray(au) ? au[0] : au;
      if (appUser?.full_name) memberStaffMap.set(s.id, appUser.full_name as string);
    }
  }

  const serviceMap = new Map<string, { name: string; price: number }>();
  if (serviceIds.length > 0) {
    const { data: svcs } = await client.from("services").select("id, name, price").in("id", serviceIds);
    for (const s of svcs ?? []) serviceMap.set(s.id, { name: s.name, price: Number(s.price ?? 0) });
  }

  for (const raw of base as Record<string, unknown>[]) {
    const seatId = raw.seat_id as string | null;
    const staffId = raw.staff_id as string | null;
    const serviceId = raw.service_id as string | null;
    const ticketId = raw.ticket_id as string;
    const member: TicketSeatMember = {
      id: raw.id as string,
      ticket_id: ticketId,
      seat_id: seatId,
      staff_id: staffId,
      service_id: serviceId,
      status: raw.status as string,
      started_at: raw.started_at as string | null,
      completed_at: raw.completed_at as string | null,
      created_at: raw.created_at as string,
      seat: seatId ? (seatMap.get(seatId) ?? null) : null,
      staff: staffId && memberStaffMap.has(staffId) ? { full_name: memberStaffMap.get(staffId)! } : null,
      service: serviceId ? (serviceMap.get(serviceId) ?? null) : null,
    };
    const existing = map.get(ticketId) ?? [];
    existing.push(member);
    map.set(ticketId, existing);
  }

  return map;
}

export async function getQueueTickets(
  client: Client,
  tenantId: string,
  branchId: string
): Promise<{ data: QueueTicketWithRelations[] | null; error: Error | null }> {
  const queueDay = shopCalendarDateString();

  // Fetch tickets with their direct relations (no queue_ticket_seats join — fetched separately below).
  const { data, error } = await client
    .from("queue_tickets")
    .select(
      `id, queue_number, status, branch_id, customer_id, service_id, assigned_staff_id,
       preferred_staff_id, seat_id, estimated_wait_min, party_size, called_at, completed_at,
       created_at, updated_at,
       customers (full_name, phone),
       staff_profiles (app_users (full_name)),
       services (name, price),
       branch_seats (seat_number, label)`
    )
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("queue_day", queueDay)
    .order("created_at", { ascending: true });

  if (!error && data) {
    const tickets = (data ?? []).map((row: Record<string, unknown>) => mapQueueTicket(row));
    const seatsMap = await fetchTicketSeatsMap(client, tickets.map((t) => t.id));
    for (const t of tickets) t.ticket_seats = seatsMap.get(t.id) ?? [];
    return { data: tickets, error: null };
  }

  // Fallback when RLS blocks related joins but queue_tickets itself is accessible.
  const { data: baseData, error: baseError } = await client
    .from("queue_tickets")
    .select(
      `id, queue_number, status, branch_id, customer_id, service_id, assigned_staff_id,
       preferred_staff_id, seat_id, estimated_wait_min, party_size, called_at, completed_at,
       created_at, updated_at`
    )
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("queue_day", queueDay)
    .order("created_at", { ascending: true });

  if (baseError) {
    return { data: null, error: new Error(baseError.message) };
  }

  // Fetch customer names separately.
  const customerIds = (baseData ?? [])
    .map((r) => (r as Record<string, unknown>).customer_id as string | null)
    .filter((id): id is string => !!id);

  const customerMap = new Map<string, { full_name: string; phone: string }>();
  if (customerIds.length > 0) {
    const { data: customers } = await client.from("customers").select("id, full_name, phone").in("id", customerIds);
    for (const c of customers ?? []) customerMap.set(c.id, { full_name: c.full_name, phone: c.phone ?? "" });
  }

  // Fetch staff names separately.
  const staffIds = (baseData ?? [])
    .map((r) => (r as Record<string, unknown>).assigned_staff_id as string | null)
    .filter((id): id is string => !!id);

  const staffMap = new Map<string, string>();
  if (staffIds.length > 0) {
    const { data: staffRows } = await client.from("staff_profiles").select("id, app_users (full_name)").in("id", staffIds);
    for (const s of staffRows ?? []) {
      const au = (s as Record<string, unknown>).app_users as Record<string, unknown> | Record<string, unknown>[] | null;
      const appUser = Array.isArray(au) ? au[0] : au;
      if (appUser?.full_name) staffMap.set(s.id, appUser.full_name as string);
    }
  }

  const ticketIds = (baseData ?? []).map((r) => (r as Record<string, unknown>).id as string);
  const seatsMap = await fetchTicketSeatsMap(client, ticketIds);

  const tickets: QueueTicketWithRelations[] = (baseData ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    queue_number: row.queue_number as string,
    status: row.status as string,
    branch_id: row.branch_id as string,
    customer_id: row.customer_id as string | null,
    service_id: row.service_id as string | null,
    assigned_staff_id: row.assigned_staff_id as string | null,
    preferred_staff_id: row.preferred_staff_id as string | null,
    seat_id: row.seat_id as string | null,
    estimated_wait_min: row.estimated_wait_min as number | null,
    party_size: typeof row.party_size === "number" ? row.party_size : 1,
    called_at: row.called_at as string | null,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    customer: customerMap.get(row.customer_id as string) ?? null,
    assigned_staff: staffMap.has(row.assigned_staff_id as string)
      ? { full_name: staffMap.get(row.assigned_staff_id as string)! }
      : null,
    service: null,
    seat: null,
    ticket_seats: seatsMap.get(row.id as string) ?? [],
  }));

  return { data: tickets, error: null };
}

export async function getQueueStats(
  client: Client,
  tenantId: string,
  branchId: string
): Promise<{
  data: { waiting: number; inProgress: number; completed: number } | null;
  error: Error | null;
}> {
  const queueDay = shopCalendarDateString();

  const { count: waiting, error: waitingError } = await client
    .from("queue_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("status", "waiting")
    .eq("queue_day", queueDay);

  if (waitingError) {
    return { data: null, error: new Error(waitingError.message) };
  }

  const { count: inProgress, error: inProgressError } = await client
    .from("queue_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("status", "in_service")
    .eq("queue_day", queueDay);

  if (inProgressError) {
    return { data: null, error: new Error(inProgressError.message) };
  }

  const { count: completed, error: completedError } = await client
    .from("queue_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("status", "completed")
    .eq("queue_day", queueDay);

  if (completedError) {
    return { data: null, error: new Error(completedError.message) };
  }

  return {
    data: {
      waiting: waiting ?? 0,
      inProgress: inProgress ?? 0,
      completed: completed ?? 0,
    },
    error: null,
  };
}

export async function getQueueTicketsForBranch(
  client: Client,
  branchId: string,
  queueDay: string = shopCalendarDateString()
): Promise<{
  data: QueueTicketWithRelations[] | null;
  branchName: string | null;
  error: Error | null;
}> {
  const { data: branch, error: branchError } = await client
    .from("branches")
    .select("name")
    .eq("id", branchId)
    .maybeSingle();

  const { data, error } = await client
    .from("queue_tickets")
    .select(
      `
      id,
      queue_number,
      status,
      branch_id,
      customer_id,
      service_id,
      assigned_staff_id,
      preferred_staff_id,
      seat_id,
      estimated_wait_min,
      party_size,
      called_at,
      completed_at,
      created_at,
      updated_at,
      customers (full_name, phone),
      staff_profiles (app_users (full_name)),
      services (name, price),
      branch_seats (seat_number, label),
      queue_ticket_seats (
        id, ticket_id, seat_id, staff_id, service_id, status, started_at, completed_at, created_at,
        branch_seats (seat_number, label),
        staff_profiles (app_users (full_name)),
        services (name, price)
      )
    `
    )
    .eq("branch_id", branchId)
    .eq("queue_day", queueDay)
    .order("created_at", { ascending: true });

  let tickets: QueueTicketWithRelations[] = [];
  let ticketsError: Error | null = null;

  if (error) {
    // Public board may have RLS access to queue_tickets but not related tables.
    // Fallback to base fields so the board still renders.
    const { data: baseData, error: baseError } = await client
      .from("queue_tickets")
      .select(
        `
        id,
        queue_number,
        status,
        branch_id,
        customer_id,
        service_id,
        assigned_staff_id,
        preferred_staff_id,
        seat_id,
        estimated_wait_min,
        party_size,
        called_at,
        completed_at,
        created_at,
        updated_at
      `
      )
      .eq("branch_id", branchId)
      .eq("queue_day", queueDay)
      .order("created_at", { ascending: true });

    if (baseError) {
      ticketsError = new Error(baseError.message);
    } else {
      tickets = (baseData ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        queue_number: row.queue_number as string,
        status: row.status as string,
        branch_id: row.branch_id as string,
        customer_id: row.customer_id as string | null,
        service_id: row.service_id as string | null,
        assigned_staff_id: row.assigned_staff_id as string | null,
        preferred_staff_id: row.preferred_staff_id as string | null,
        seat_id: row.seat_id as string | null,
        estimated_wait_min: row.estimated_wait_min as number | null,
        party_size: typeof row.party_size === "number" ? row.party_size : 1,
        called_at: row.called_at as string | null,
        completed_at: row.completed_at as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        customer: null,
        assigned_staff: null,
        service: null,
        seat: null,
        ticket_seats: [],
      }));
    }
  } else {
    tickets = (data ?? []).map((row: Record<string, unknown>) => mapQueueTicket(row));
  }

  return {
    data: tickets,
    branchName: branch?.name ?? null,
    error: ticketsError,
  };
}
