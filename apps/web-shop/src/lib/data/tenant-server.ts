"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-cached staff list for a tenant/branch.
 * Revalidated via "staff" tag after staff create/update/delete.
 */
export const getStaffMembersServer = unstable_cache(
  async (tenantId: string, branchId: string | null): Promise<{
    data: Array<{ id: string; full_name: string; role: string | null; staff_profile_id: string }> | null;
    error: string | null;
  }> => {
    const supabase = await createClient();

    let query = supabase
      .from("app_users")
      .select("id, full_name, role, staff_profile_id:id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .neq("role", "owner");

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    return {
      data: (data ?? []).map((u) => ({
        id: u.id,
        full_name: u.full_name ?? "",
        role: u.role,
        staff_profile_id: u.id,
      })),
      error: null,
    };
  },
  ["staff-server"],
  {
    tags: ["staff"],
    revalidate: 300, // 5 min — roster changes rarely
  }
);

/**
 * Server-cached service catalog for a tenant.
 * Revalidated via "services" tag after catalog create/update/delete.
 */
export const getServicesServer = unstable_cache(
  async (tenantId: string): Promise<{
    data: Array<{ id: string; name: string; price: number; duration_min: number; category_id: string | null }> | null;
    error: string | null;
  }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration_min, category_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name");

    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },
  ["services-server"],
  {
    tags: ["services"],
    revalidate: 900, // 15 min — catalog rarely changes
  }
);
