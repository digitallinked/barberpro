import { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "owner" | "manager" | "barber" | "cashier";

export type StaffSession = {
  userId: string;
  appUserId: string;
  tenantId: string;
  branchId: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  phone: string | null;
};

/**
 * Resolves the authenticated staff session.
 * Uses getUser() (server-validated) rather than getSession() (cookie-readable).
 * Queries app_users to get tenant, branch, role context.
 */
export async function resolveStaffSession(
  supabase: SupabaseClient
): Promise<StaffSession | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: appUser, error: appUserError } = await supabase
    .from("app_users")
    .select("id, tenant_id, branch_id, role, full_name, email, phone")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (appUserError || !appUser?.tenant_id || !appUser?.branch_id) return null;

  return {
    userId: user.id,
    appUserId: appUser.id,
    tenantId: appUser.tenant_id,
    branchId: appUser.branch_id,
    role: appUser.role as UserRole,
    fullName: appUser.full_name ?? "Staff",
    email: appUser.email ?? null,
    phone: appUser.phone ?? null,
  };
}
