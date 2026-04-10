import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type PayrollPeriodRow = Tables<"payroll_periods">;

export type StaffPayslipDetails = {
  full_name: string;
  nric_number: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  num_dependents: number | null;
  epf_number: string | null;
  epf_enabled: boolean;
  socso_number: string | null;
  socso_enabled: boolean;
  eis_number: string | null;
  tax_ref_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  employee_code: string | null;
};

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
  days_worked: number | null;
  total_working_days: number | null;
  service_revenue: number | null;
  product_revenue: number | null;
  services_count: number | null;
  customers_served: number | null;
  created_at: string;
  updated_at: string;
  staff: StaffPayslipDetails | null;
};

const ENTRY_SELECT = `
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
  days_worked,
  total_working_days,
  service_revenue,
  product_revenue,
  services_count,
  customers_served,
  created_at,
  updated_at,
  staff_profiles!payroll_entries_staff_id_fkey (
    nric_number,
    date_of_birth,
    marital_status,
    num_dependents,
    epf_number,
    epf_enabled,
    socso_number,
    socso_enabled,
    eis_number,
    tax_ref_number,
    bank_name,
    bank_account_number,
    address_line1,
    address_line2,
    city,
    state,
    postcode,
    employee_code,
    app_users!inner (full_name)
  )
`;

function mapEntryRow(row: Record<string, unknown>): PayrollEntryWithStaff {
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
    days_worked: (row.days_worked as number | null) ?? null,
    total_working_days: (row.total_working_days as number | null) ?? null,
    service_revenue: (row.service_revenue as number | null) ?? null,
    product_revenue: (row.product_revenue as number | null) ?? null,
    services_count: (row.services_count as number | null) ?? null,
    customers_served: (row.customers_served as number | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    staff: staffData && staffProfile
      ? {
          full_name: (staffData as Record<string, unknown>).full_name as string,
          nric_number: staffProfile.nric_number as string | null,
          date_of_birth: staffProfile.date_of_birth as string | null,
          marital_status: staffProfile.marital_status as string | null,
          num_dependents: staffProfile.num_dependents as number | null,
          epf_number: staffProfile.epf_number as string | null,
          epf_enabled: (staffProfile.epf_enabled as boolean) ?? true,
          socso_number: staffProfile.socso_number as string | null,
          socso_enabled: (staffProfile.socso_enabled as boolean) ?? true,
          eis_number: staffProfile.eis_number as string | null,
          tax_ref_number: staffProfile.tax_ref_number as string | null,
          bank_name: staffProfile.bank_name as string | null,
          bank_account_number: staffProfile.bank_account_number as string | null,
          address_line1: staffProfile.address_line1 as string | null,
          address_line2: staffProfile.address_line2 as string | null,
          city: staffProfile.city as string | null,
          state: staffProfile.state as string | null,
          postcode: staffProfile.postcode as string | null,
          employee_code: staffProfile.employee_code as string | null,
        }
      : null,
  };
}

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

export async function getAllPayrollEntries(
  client: Client,
  tenantId: string,
  yearStart?: string,
  yearEnd?: string
): Promise<{ data: PayrollEntryWithStaff[] | null; error: Error | null }> {
  let query = client
    .from("payroll_entries")
    .select(
      `
      ${ENTRY_SELECT},
      payroll_periods!inner (period_start, period_end, status)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (yearStart) query = query.gte("created_at", yearStart);
  if (yearEnd)   query = query.lte("created_at", yearEnd);

  const { data, error } = await query;
  if (error) return { data: null, error: new Error(error.message) };

  const entries = (data ?? []).map((row: Record<string, unknown>) => mapEntryRow(row));
  return { data: entries, error: null };
}

export async function getPayrollEntries(
  client: Client,
  periodId: string
): Promise<{ data: PayrollEntryWithStaff[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("payroll_entries")
    .select(ENTRY_SELECT)
    .eq("payroll_period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const entries = (data ?? []).map((row: Record<string, unknown>) => mapEntryRow(row));
  return { data: entries, error: null };
}
