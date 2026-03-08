import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type CommissionSchemeRow = Tables<"commission_schemes">;

export type StaffAssignmentWithDetails = {
  id: string;
  scheme_id: string;
  staff_id: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
  scheme: { name: string } | null;
  staff: { full_name: string } | null;
};

export async function getCommissionSchemes(
  client: Client,
  tenantId: string
): Promise<{ data: CommissionSchemeRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("commission_schemes")
    .select("id, name, payout_model, base_salary, percentage_rate, per_service_amount, per_customer_amount, product_commission_rate, is_active, deduction_rules, target_bonus_rules, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getStaffAssignments(
  client: Client,
  tenantId: string
): Promise<{ data: StaffAssignmentWithDetails[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("staff_commission_assignments")
    .select(
      `
      id,
      scheme_id,
      staff_id,
      effective_from,
      effective_to,
      created_at,
      updated_at,
      commission_schemes (name),
      staff_profiles!staff_commission_assignments_staff_id_fkey (app_users!inner (full_name))
    `
    )
    .eq("tenant_id", tenantId)
    .order("effective_from", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const assignments: StaffAssignmentWithDetails[] = (data ?? []).map((row: Record<string, unknown>) => {
    const scheme = row.commission_schemes as Record<string, unknown> | null;
    const staffProfile = row.staff_profiles as Record<string, unknown> | null;
    const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
    const staffData = Array.isArray(appUser) ? appUser[0] : appUser;

    return {
      id: row.id as string,
      scheme_id: row.scheme_id as string,
      staff_id: row.staff_id as string,
      effective_from: row.effective_from as string,
      effective_to: row.effective_to as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      scheme: scheme ? { name: scheme.name as string } : null,
      staff: staffData
        ? { full_name: (staffData as Record<string, unknown>).full_name as string }
        : null,
    };
  });

  return { data: assignments, error: null };
}
