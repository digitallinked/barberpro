import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type BranchRow = Tables<"branches">;
export type BranchImage = Tables<"branch_images">;

const BRANCH_FIELDS =
  "id, name, slug, code, address, phone, email, is_active, is_hq, logo_url, operating_hours, tenant_id, created_at, updated_at, checkin_token, accepts_online_bookings, accepts_walkin_queue, latitude, longitude";

export async function getBranches(
  client: Client,
  tenantId: string
): Promise<{ data: BranchRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("branches")
    .select(BRANCH_FIELDS)
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
    .select(BRANCH_FIELDS)
    .eq("id", id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function getBranchBySlug(
  client: Client,
  tenantId: string,
  slug: string
): Promise<{ data: BranchRow | null; error: Error | null }> {
  const { data, error } = await client
    .from("branches")
    .select(BRANCH_FIELDS)
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function getBranchImages(
  client: Client,
  branchId: string
): Promise<{ data: BranchImage[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("branch_images")
    .select("id, branch_id, tenant_id, storage_path, sort_order, created_at")
    .eq("branch_id", branchId)
    .order("sort_order", { ascending: true });

  return { data, error: error ? new Error(error.message) : null };
}
