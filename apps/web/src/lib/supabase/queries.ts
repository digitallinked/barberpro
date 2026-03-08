"use server";

import { createClient } from "./server";

export type TenantContext = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userId: string;
  appUserId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  branchId: string | null;
  branchName: string | null;
  branches: { id: string; name: string; is_hq: boolean }[];
};

export async function getCurrentTenant(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, tenant_id, branch_id, full_name, email, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!appUser?.tenant_id) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", appUser.tenant_id)
    .single();

  if (!tenant) return null;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, is_hq")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("is_hq", { ascending: false });

  const branchList = branches ?? [];
  const activeBranch =
    branchList.find((b) => b.id === appUser.branch_id) ??
    branchList.find((b) => b.is_hq) ??
    branchList[0] ??
    null;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    userId: user.id,
    appUserId: appUser.id,
    userName: appUser.full_name,
    userEmail: appUser.email ?? user.email ?? "",
    userRole: appUser.role,
    branchId: activeBranch?.id ?? null,
    branchName: activeBranch?.name ?? null,
    branches: branchList,
  };
}
