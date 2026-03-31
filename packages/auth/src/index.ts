import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthContext = {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
  appUser: {
    id: string;
    tenant_id: string;
    branch_id: string | null;
    role: string;
  };
  tenantId: string;
  appUserId: string;
};

/**
 * Resolves the authenticated user and their tenant context.
 * Throws if the user is not authenticated or has no tenant.
 * The supabase client must already be session-scoped (server client, not admin).
 */
export async function resolveAuthContext(supabase: SupabaseClient): Promise<AuthContext> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, tenant_id, branch_id, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!appUser?.tenant_id) throw new Error("No tenant");

  return {
    supabase,
    user: { id: user.id, email: user.email },
    appUser,
    tenantId: appUser.tenant_id,
    appUserId: appUser.id,
  };
}

export type UserRole = "owner" | "manager" | "barber" | "cashier" | "customer";

export function isOwnerOrManager(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function hasRole(role: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role as UserRole);
}
