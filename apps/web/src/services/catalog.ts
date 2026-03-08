import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type ServiceRow = Tables<"services">;
type ServiceCategoryRow = Tables<"service_categories">;

export async function getServices(
  client: Client,
  tenantId: string
): Promise<{ data: ServiceRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("services")
    .select("id, name, category_id, duration_min, price, is_active, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getServiceCategories(
  client: Client,
  tenantId: string
): Promise<{ data: ServiceCategoryRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("service_categories")
    .select("id, name, is_active, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  return { data, error: error ? new Error(error.message) : null };
}
