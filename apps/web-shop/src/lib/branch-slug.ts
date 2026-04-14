import type { SupabaseClient } from "@supabase/supabase-js";

export type BranchRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  code: string;
  is_hq: boolean;
  is_active: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  operating_hours: unknown;
  logo_url: string | null;
  accepts_online_bookings: boolean;
  accepts_walkin_queue: boolean;
  latitude: number | null;
  longitude: number | null;
};

export async function resolveBranchBySlug(
  supabase: SupabaseClient,
  tenantId: string,
  slug: string,
): Promise<BranchRow | null> {
  const { data } = await supabase
    .from("branches")
    .select(
      "id, tenant_id, name, slug, code, is_hq, is_active, address, phone, email, operating_hours, logo_url, accepts_online_bookings, accepts_walkin_queue, latitude, longitude",
    )
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return (data as BranchRow) ?? null;
}
