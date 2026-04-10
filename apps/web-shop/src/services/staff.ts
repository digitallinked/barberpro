import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type StaffMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  branch_id: string | null;
  staff_profile_id: string;
  employee_code: string | null;
  employment_type: string;
  base_salary: number;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
  // Personal details
  nric_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  marital_status: string | null;
  num_dependents: number | null;
  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  // Statutory registration
  epf_number: string | null;
  epf_enabled: boolean;
  socso_number: string | null;
  socso_enabled: boolean;
  eis_number: string | null;
  tax_ref_number: string | null;
  // Banking
  bank_name: string | null;
  bank_account_number: string | null;
  // Emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  // Notes
  notes: string | null;
};

const STAFF_PROFILE_SELECT = `
  id,
  employee_code,
  employment_type,
  base_salary,
  joined_at,
  nric_number,
  date_of_birth,
  gender,
  nationality,
  marital_status,
  num_dependents,
  address_line1,
  address_line2,
  city,
  state,
  postcode,
  epf_number,
  epf_enabled,
  socso_number,
  socso_enabled,
  eis_number,
  tax_ref_number,
  bank_name,
  bank_account_number,
  emergency_contact_name,
  emergency_contact_phone,
  notes,
  app_users!inner (
    id,
    full_name,
    email,
    phone,
    role,
    is_active,
    branch_id,
    created_at,
    updated_at
  )
`;

function mapStaffRow(row: Record<string, unknown>): StaffMember {
  const appUser = Array.isArray(row.app_users) ? row.app_users[0] : row.app_users;
  const userObj = appUser as Record<string, unknown>;
  return {
    id: userObj?.id as string,
    full_name: userObj?.full_name as string,
    email: userObj?.email as string | null,
    phone: userObj?.phone as string | null,
    role: userObj?.role as string,
    is_active: userObj?.is_active as boolean,
    branch_id: userObj?.branch_id as string | null,
    staff_profile_id: row.id as string,
    employee_code: row.employee_code as string | null,
    employment_type: row.employment_type as string,
    base_salary: (row.base_salary as number) ?? 0,
    joined_at: row.joined_at as string | null,
    created_at: userObj?.created_at as string,
    updated_at: userObj?.updated_at as string,
    nric_number: row.nric_number as string | null,
    date_of_birth: row.date_of_birth as string | null,
    gender: row.gender as string | null,
    nationality: row.nationality as string | null,
    marital_status: row.marital_status as string | null,
    num_dependents: row.num_dependents as number | null,
    address_line1: row.address_line1 as string | null,
    address_line2: row.address_line2 as string | null,
    city: row.city as string | null,
    state: row.state as string | null,
    postcode: row.postcode as string | null,
    epf_number: row.epf_number as string | null,
    epf_enabled: (row.epf_enabled as boolean) ?? true,
    socso_number: row.socso_number as string | null,
    socso_enabled: (row.socso_enabled as boolean) ?? true,
    eis_number: row.eis_number as string | null,
    tax_ref_number: row.tax_ref_number as string | null,
    bank_name: row.bank_name as string | null,
    bank_account_number: row.bank_account_number as string | null,
    emergency_contact_name: row.emergency_contact_name as string | null,
    emergency_contact_phone: row.emergency_contact_phone as string | null,
    notes: row.notes as string | null,
  };
}

export async function getStaffMembers(
  client: Client,
  tenantId: string,
  branchId?: string | null,
): Promise<{ data: StaffMember[] | null; error: Error | null }> {
  let query = client
    .from("staff_profiles")
    .select(STAFF_PROFILE_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (branchId) {
    query = query.eq("app_users.branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: (data ?? []).map((row) => mapStaffRow(row as Record<string, unknown>)), error: null };
}

export async function getStaffMember(
  client: Client,
  id: string
): Promise<{ data: StaffMember | null; error: Error | null }> {
  const { data, error } = await client
    .from("staff_profiles")
    .select(STAFF_PROFILE_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) return { data: null, error: null };

  return { data: mapStaffRow(data as unknown as Record<string, unknown>), error: null };
}

export async function getStaffStats(
  client: Client,
  tenantId: string
): Promise<{
  data: { total: number; active: number; newThisMonth: number } | null;
  error: Error | null;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: total, error: totalError } = await client
    .from("staff_profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (totalError) {
    return { data: null, error: new Error(totalError.message) };
  }

  const { count: active, error: activeError } = await client
    .from("staff_profiles")
    .select("id, app_users!inner(is_active)", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("app_users.is_active", true);

  if (activeError) {
    return { data: null, error: new Error(activeError.message) };
  }

  const { count: newThisMonth, error: monthError } = await client
    .from("staff_profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfMonth.toISOString());

  if (monthError) {
    return { data: null, error: new Error(monthError.message) };
  }

  return {
    data: {
      total: total ?? 0,
      active: active ?? 0,
      newThisMonth: newThisMonth ?? 0,
    },
    error: null,
  };
}
