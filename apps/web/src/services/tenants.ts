import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type TenantRow = Tables<"tenants">;

export type TenantProfile = Pick<
  TenantRow,
  | "id"
  | "name"
  | "email"
  | "phone"
  | "address_line1"
  | "city"
  | "postcode"
  | "state"
  | "registration_number"
>;

export async function getTenantProfile(
  client: Client,
  tenantId: string
): Promise<{ data: TenantProfile | null; error: Error | null }> {
  const { data, error } = await client
    .from("tenants")
    .select("id, name, email, phone, address_line1, city, postcode, state, registration_number")
    .eq("id", tenantId)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}
