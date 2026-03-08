import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type CustomerRow = Tables<"customers">;

export async function getCustomers(
  client: Client,
  tenantId: string
): Promise<{ data: CustomerRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("customers")
    .select("id, full_name, phone, email, date_of_birth, loyalty_points, notes, branch_id, preferred_barber_id, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getCustomer(
  client: Client,
  id: string
): Promise<{ data: CustomerRow | null; error: Error | null }> {
  const { data, error } = await client
    .from("customers")
    .select("id, full_name, phone, email, date_of_birth, loyalty_points, notes, branch_id, preferred_barber_id, tenant_id, created_at, updated_at")
    .eq("id", id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function getCustomerStats(
  client: Client,
  tenantId: string
): Promise<{
  data: { total: number; newThisMonth: number } | null;
  error: Error | null;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: total, error: totalError } = await client
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (totalError) {
    return { data: null, error: new Error(totalError.message) };
  }

  const { count: newThisMonth, error: monthError } = await client
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfMonth.toISOString());

  if (monthError) {
    return { data: null, error: new Error(monthError.message) };
  }

  return {
    data: { total: total ?? 0, newThisMonth: newThisMonth ?? 0 },
    error: null,
  };
}
