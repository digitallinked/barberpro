import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { shopCalendarDateString } from "@/lib/shop-day";

type Client = SupabaseClient<Database>;

export type QueueTicketWithRelations = {
  id: string;
  queue_number: string;
  status: string;
  branch_id: string;
  customer_id: string | null;
  service_id: string | null;
  assigned_staff_id: string | null;
  preferred_staff_id: string | null;
  estimated_wait_min: number | null;
  party_size: number;
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { full_name: string; phone: string } | null;
  assigned_staff: { full_name: string } | null;
  service: { name: string; price: number } | null;
};

function mapQueueTicket(row: Record<string, unknown>): QueueTicketWithRelations {
  const customer = row.customers as Record<string, unknown> | null;
  const staffProfile = row.staff_profiles as Record<string, unknown> | null;
  const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
  const staffName = Array.isArray(appUser) ? appUser[0] : appUser;
  const service = row.services as Record<string, unknown> | null;

  return {
    id: row.id as string,
    queue_number: row.queue_number as string,
    status: row.status as string,
    branch_id: row.branch_id as string,
    customer_id: row.customer_id as string | null,
    service_id: row.service_id as string | null,
    assigned_staff_id: row.assigned_staff_id as string | null,
    preferred_staff_id: row.preferred_staff_id as string | null,
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
  };
}

export async function getQueueTickets(
  client: Client,
  tenantId: string,
  branchId: string
): Promise<{ data: QueueTicketWithRelations[] | null; error: Error | null }> {
  const queueDay = shopCalendarDateString();

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
      estimated_wait_min,
      party_size,
      called_at,
      completed_at,
      created_at,
      updated_at,
      customers (full_name, phone),
      staff_profiles (app_users (full_name)),
      services (name, price)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("queue_day", queueDay)
    .order("created_at", { ascending: true });

  if (!error) {
    const tickets: QueueTicketWithRelations[] = (data ?? []).map((row: Record<string, unknown>) =>
      mapQueueTicket(row)
    );
    return { data: tickets, error: null };
  }

  // Fallback when RLS blocks related joins but queue_tickets itself is accessible.
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
      estimated_wait_min,
      party_size,
      called_at,
      completed_at,
      created_at,
      updated_at
    `
    )
    .eq("tenant_id", tenantId)
    .eq("branch_id", branchId)
    .eq("queue_day", queueDay)
    .order("created_at", { ascending: true });

  if (baseError) {
    return { data: null, error: new Error(baseError.message) };
  }

  const tickets: QueueTicketWithRelations[] = (baseData ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    queue_number: row.queue_number as string,
    status: row.status as string,
    branch_id: row.branch_id as string,
    customer_id: row.customer_id as string | null,
    service_id: row.service_id as string | null,
    assigned_staff_id: row.assigned_staff_id as string | null,
    preferred_staff_id: row.preferred_staff_id as string | null,
    estimated_wait_min: row.estimated_wait_min as number | null,
    party_size: typeof row.party_size === "number" ? row.party_size : 1,
    called_at: row.called_at as string | null,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    customer: null,
    assigned_staff: null,
    service: null,
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
      estimated_wait_min,
      party_size,
      called_at,
      completed_at,
      created_at,
      updated_at,
      customers (full_name, phone),
      staff_profiles (app_users (full_name)),
      services (name, price)
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
        estimated_wait_min: row.estimated_wait_min as number | null,
        party_size: typeof row.party_size === "number" ? row.party_size : 1,
        called_at: row.called_at as string | null,
        completed_at: row.completed_at as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        customer: null,
        assigned_staff: null,
        service: null,
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
