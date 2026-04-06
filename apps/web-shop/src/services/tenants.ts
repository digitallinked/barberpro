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
> & { logo_url?: string | null };

export type TenantImage = {
  id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export async function getTenantProfile(
  client: Client,
  tenantId: string
): Promise<{ data: TenantProfile | null; error: Error | null }> {
  const { data, error } = await client
    .from("tenants")
    .select("id, name, email, phone, address_line1, city, postcode, state, registration_number, logo_url")
    .eq("id", tenantId)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function getTenantImages(
  client: Client,
  tenantId: string
): Promise<{ data: TenantImage[]; error: Error | null }> {
  const { data, error } = await client
    .from("tenant_images")
    .select("id, storage_path, sort_order, created_at")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  return { data: data ?? [], error: error ? new Error(error.message) : null };
}
