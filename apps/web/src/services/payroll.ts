import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type PayrollPeriodRow = Tables<"payroll_periods">;

export type PayrollEntryWithStaff = {
  id: string;
  payroll_period_id: string;
  staff_id: string;
  base_salary: number;
  service_commission: number;
  product_commission: number;
  bonuses: number;
  deductions: number;
  advances: number;
  net_payout: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  staff: { full_name: string } | null;
};

export async function getPayrollPeriods(
  client: Client,
  tenantId: string
): Promise<{ data: PayrollPeriodRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("payroll_periods")
    .select("id, period_start, period_end, status, branch_id, payout_due_date, approved_at, approved_by, created_by, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getPayrollEntries(
  client: Client,
  periodId: string
): Promise<{ data: PayrollEntryWithStaff[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("payroll_entries")
    .select(
      `
      id,
      payroll_period_id,
      staff_id,
      base_salary,
      service_commission,
      product_commission,
      bonuses,
      deductions,
      advances,
      net_payout,
      notes,
      created_at,
      updated_at,
      staff_profiles!payroll_entries_staff_id_fkey (app_users!inner (full_name))
    `
    )
    .eq("payroll_period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const entries: PayrollEntryWithStaff[] = (data ?? []).map((row: Record<string, unknown>) => {
    const staffProfile = row.staff_profiles as Record<string, unknown> | null;
    const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
    const staffData = Array.isArray(appUser) ? appUser[0] : appUser;

    return {
      id: row.id as string,
      payroll_period_id: row.payroll_period_id as string,
      staff_id: row.staff_id as string,
      base_salary: row.base_salary as number,
      service_commission: row.service_commission as number,
      product_commission: row.product_commission as number,
      bonuses: row.bonuses as number,
      deductions: row.deductions as number,
      advances: row.advances as number,
      net_payout: row.net_payout as number,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      staff: staffData
        ? { full_name: (staffData as Record<string, unknown>).full_name as string }
        : null,
    };
  });

  return { data: entries, error: null };
}
