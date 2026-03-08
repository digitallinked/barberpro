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
};

export async function getStaffMembers(
  client: Client,
  tenantId: string
): Promise<{ data: StaffMember[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("staff_profiles")
    .select(
      `
      id,
      employee_code,
      employment_type,
      base_salary,
      joined_at,
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
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const staffMembers: StaffMember[] = (data ?? []).map((row: Record<string, unknown>) => {
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
    };
  });

  return { data: staffMembers, error: null };
}

export async function getStaffMember(
  client: Client,
  id: string
): Promise<{ data: StaffMember | null; error: Error | null }> {
  const { data, error } = await client
    .from("staff_profiles")
    .select(
      `
      id,
      employee_code,
      employment_type,
      base_salary,
      joined_at,
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
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data) return { data: null, error: null };

  const appUser = Array.isArray(data.app_users) ? data.app_users[0] : data.app_users;
  const userObj = appUser as Record<string, unknown>;

  const staffMember: StaffMember = {
    id: userObj?.id as string,
    full_name: userObj?.full_name as string,
    email: userObj?.email as string | null,
    phone: userObj?.phone as string | null,
    role: userObj?.role as string,
    is_active: userObj?.is_active as boolean,
    branch_id: userObj?.branch_id as string | null,
    staff_profile_id: data.id,
    employee_code: data.employee_code,
    employment_type: data.employment_type,
    base_salary: data.base_salary ?? 0,
    joined_at: data.joined_at,
    created_at: userObj?.created_at as string,
    updated_at: userObj?.updated_at as string,
  };

  return { data: staffMember, error: null };
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
