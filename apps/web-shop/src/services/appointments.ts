import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type AppointmentWithRelations = {
  id: string;
  customer_id: string;
  service_id: string;
  branch_id: string;
  barber_staff_id: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: { full_name: string; phone: string } | null;
  service: { name: string; duration_min: number; price: number } | null;
  barber: { full_name: string } | null;
};

export async function getAppointments(
  client: Client,
  tenantId: string,
  branchId?: string
): Promise<{ data: AppointmentWithRelations[] | null; error: Error | null }> {
  let query = client
    .from("appointments")
    .select(
      `
      id,
      customer_id,
      service_id,
      branch_id,
      barber_staff_id,
      start_at,
      end_at,
      status,
      source,
      notes,
      created_at,
      updated_at,
      customers (full_name, phone),
      services (name, duration_min, price),
      staff_profiles!appointments_barber_staff_id_fkey (app_users!inner (full_name))
    `
    )
    .eq("tenant_id", tenantId)
    .order("start_at", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const appointments: AppointmentWithRelations[] = (data ?? []).map((row: Record<string, unknown>) => {
    const customer = row.customers as Record<string, unknown> | null;
    const service = row.services as Record<string, unknown> | null;
    const staffProfile = row.staff_profiles as Record<string, unknown> | null;
    const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
    const barberData = Array.isArray(appUser) ? appUser[0] : appUser;

    return {
      id: row.id as string,
      customer_id: row.customer_id as string,
      service_id: row.service_id as string,
      branch_id: row.branch_id as string,
      barber_staff_id: row.barber_staff_id as string | null,
      start_at: row.start_at as string,
      end_at: row.end_at as string | null,
      status: row.status as string,
      source: row.source as string,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      customer: customer
        ? { full_name: customer.full_name as string, phone: customer.phone as string }
        : null,
      service: service
        ? {
            name: service.name as string,
            duration_min: service.duration_min as number,
            price: service.price as number,
          }
        : null,
      barber: barberData
        ? { full_name: (barberData as Record<string, unknown>).full_name as string }
        : null,
    };
  });

  return { data: appointments, error: null };
}
