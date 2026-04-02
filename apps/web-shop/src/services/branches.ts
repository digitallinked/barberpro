import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type BranchRow = Tables<"branches">;

export async function getBranches(
  client: Client,
  tenantId: string
): Promise<{ data: BranchRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("branches")
    .select(
      "id, name, code, address, phone, email, is_active, is_hq, operating_hours, tenant_id, created_at, updated_at, checkin_token, accepts_online_bookings, accepts_walkin_queue"
    )
    .eq("tenant_id", tenantId)
    .order("is_hq", { ascending: false })
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getBranch(
  client: Client,
  id: string
): Promise<{ data: BranchRow | null; error: Error | null }> {
  const { data, error } = await client
    .from("branches")
    .select(
      "id, name, code, address, phone, email, is_active, is_hq, operating_hours, tenant_id, created_at, updated_at, checkin_token, accepts_online_bookings, accepts_walkin_queue"
    )
    .eq("id", id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}
