"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { createClient } from "./server";

type ServerClient = SupabaseClient<Database>;

/**
 * Picks the branch for queue/check-in actions: explicit choice (if valid),
 * then the user's assigned branch, then HQ, then first active branch.
 */
export async function resolveEffectiveBranchId(
  supabase: ServerClient,
  tenantId: string,
  appUserBranchId: string | null,
  requestedBranchId?: string | null
): Promise<string | null> {
  const { data: branches } = await supabase
    .from("branches")
    .select("id, is_hq")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("is_hq", { ascending: false });

  const list = branches ?? [];
  if (list.length === 0) return null;

  if (requestedBranchId && list.some((b) => b.id === requestedBranchId)) {
    return requestedBranchId;
  }
  if (appUserBranchId && list.some((b) => b.id === appUserBranchId)) {
    return appUserBranchId;
  }
  const hq = list.find((b) => b.is_hq);
  return hq?.id ?? list[0]!.id;
}

export type TenantContext = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
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
    .select("id, name, slug, plan")
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
  const activeBranchId = await resolveEffectiveBranchId(
    supabase,
    tenant.id,
    appUser.branch_id,
    null
  );
  const activeBranch = branchList.find((b) => b.id === activeBranchId) ?? null;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantPlan: tenant.plan ?? "starter",
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
