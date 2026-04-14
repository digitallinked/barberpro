"use server";

import { cache } from "react";
import { createClient } from "./server";
import { pickEffectiveBranchId } from "./branch-resolution";
import type { Language } from "@/lib/i18n/translations";

export type TenantContext = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  stripeSubscriptionId: string | null;
  preferredLanguage: Language;
  userId: string;
  appUserId: string;
  userName: string;
  userEmail: string;
  /** Phone from app_users; may be empty if not set */
  userPhone: string;
  /** Avatar storage path under shop-media bucket; empty string when not set */
  userAvatarUrl: string;
  userRole: string;
  branchId: string | null;
  branchName: string | null;
  branchSlug: string | null;
  branches: { id: string; name: string; slug: string; is_hq: boolean }[];
};

export const getCurrentTenant = cache(async function getCurrentTenant(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, tenant_id, branch_id, full_name, email, phone, avatar_url, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!appUser?.tenant_id) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, subscription_status, trial_ends_at, stripe_subscription_id")
    .eq("id", appUser.tenant_id)
    .single();

  if (!tenant) return null;

  // preferred_language may not be in generated Supabase types yet — cast to bypass
  const { data: langRow } = (await supabase
    .from("tenants")
    .select("preferred_language" as string & keyof never)
    .eq("id", appUser.tenant_id)
    .single()) as { data: { preferred_language?: string } | null };
  const preferredLang = langRow?.preferred_language;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, slug, is_hq")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("is_hq", { ascending: false });

  const branchList = branches ?? [];
  const activeBranchId = pickEffectiveBranchId(branchList, appUser.branch_id, null);
  const activeBranch = branchList.find((b) => b.id === activeBranchId) ?? null;

  const preferredLanguage = (preferredLang === "en" ? "en" : "ms") as Language;

  const tenantAny = tenant as Record<string, unknown>;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantPlan: tenant.plan ?? "starter",
    subscriptionStatus: tenantAny.subscription_status as string | null ?? null,
    trialEndsAt: tenantAny.trial_ends_at as string | null ?? null,
    stripeSubscriptionId: tenantAny.stripe_subscription_id as string | null ?? null,
    preferredLanguage,
    userId: user.id,
    appUserId: appUser.id,
    userName: appUser.full_name,
    userEmail: appUser.email ?? user.email ?? "",
    userPhone: (appUser.phone as string | null) ?? "",
    userAvatarUrl: (appUser.avatar_url as string | null) ?? "",
    userRole: appUser.role,
    branchId: activeBranch?.id ?? null,
    branchName: activeBranch?.name ?? null,
    branchSlug: activeBranch?.slug ?? null,
    branches: branchList.map((b) => ({ id: b.id, name: b.name, slug: b.slug, is_hq: b.is_hq })),
  };
});
