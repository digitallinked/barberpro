"use server";

import { createClient } from "./server";
import { pickEffectiveBranchId } from "./branch-resolution";
import type { Language } from "@/lib/i18n/translations";

export type TenantContext = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  preferredLanguage: Language;
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

  let tenant: { id: string; name: string; slug: string; plan: string | null; preferred_language?: string } | null = null;

  const { data: t1, error: t1Err } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, preferred_language")
    .eq("id", appUser.tenant_id)
    .single();

  if (t1 && !t1Err) {
    tenant = t1;
  } else {
    const { data: t2 } = await supabase
      .from("tenants")
      .select("id, name, slug, plan")
      .eq("id", appUser.tenant_id)
      .single();
    if (t2) tenant = { ...t2, preferred_language: undefined };
  }

  if (!tenant) return null;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, is_hq")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("is_hq", { ascending: false });

  const branchList = branches ?? [];
  const activeBranchId = pickEffectiveBranchId(branchList, appUser.branch_id, null);
  const activeBranch = branchList.find((b) => b.id === activeBranchId) ?? null;

  const preferredLanguage = (tenant.preferred_language === "en" ? "en" : "ms") as Language;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantPlan: tenant.plan ?? "starter",
    preferredLanguage,
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
