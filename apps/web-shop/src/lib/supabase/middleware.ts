import type { SupabaseClient } from "@supabase/supabase-js";
import { createMiddlewareClient } from "@barberpro/db/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

const ACTIVE_STATUSES = ["trialing", "active", "past_due"];
const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"];

const TENANT_CACHE_COOKIE = "bp_tenant_state";
const TENANT_CACHE_MAX_AGE = 60; // seconds — refresh from DB every 60s

/** Old flat routes that must be redirected to the branch-scoped equivalents. */
const OLD_FLAT_ROUTES = [
  "/dashboard",
  "/queue",
  "/appointments",
  "/pos",
  "/customers",
  "/services",
  "/staff",
  "/payroll",
  "/commissions",
  "/inventory",
  "/expenses",
  "/promotions",
  "/reports",
];

type TenantCachePayload = {
  onboardingCompleted: boolean;
  subscriptionStatus: string | null;
  role: string | null;
  isStaff: boolean;
  /** Default branch slug for redirect — HQ for owners, assigned branch for staff. */
  defaultBranchSlug: string | null;
  ts: number;
};

function encodeTenantCache(payload: TenantCachePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeTenantCache(value: string): TenantCachePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64").toString("utf-8"));
    if (typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > TENANT_CACHE_MAX_AGE * 1000) return null;
    return parsed as TenantCachePayload;
  } catch {
    return null;
  }
}

async function fetchTenantState(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TenantCachePayload | null> {
  // 1. Try owner lookup first (fast path for shop owners)
  const { data: ownedTenant } = await supabase
    .from("tenants")
    .select("onboarding_completed, subscription_status, id")
    .eq("owner_auth_id", userId)
    .maybeSingle();

  if (ownedTenant) {
    // Find HQ branch slug for the default redirect
    const { data: hqBranch } = await supabase
      .from("branches")
      .select("slug")
      .eq("tenant_id", ownedTenant.id)
      .eq("is_active", true)
      .order("is_hq", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      onboardingCompleted: ownedTenant.onboarding_completed === true,
      subscriptionStatus: ownedTenant.subscription_status,
      role: "owner",
      isStaff: false,
      defaultBranchSlug: hqBranch?.slug ?? null,
      ts: Date.now(),
    };
  }

  // 2. Fall back to app_users lookup (staff members)
  const { data: appUser } = await supabase
    .from("app_users")
    .select("role, tenant_id, branch_id")
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!appUser?.tenant_id) return null;

  const { data: staffTenant } = await supabase
    .from("tenants")
    .select("onboarding_completed, subscription_status")
    .eq("id", appUser.tenant_id)
    .single();

  if (!staffTenant) return null;

  // Get the staff member's assigned branch slug
  let staffBranchSlug: string | null = null;
  if (appUser.branch_id) {
    const { data: staffBranch } = await supabase
      .from("branches")
      .select("slug")
      .eq("id", appUser.branch_id)
      .eq("is_active", true)
      .maybeSingle();
    staffBranchSlug = staffBranch?.slug ?? null;
  }

  if (!staffBranchSlug) {
    // Fall back to first active branch of the tenant
    const { data: firstBranch } = await supabase
      .from("branches")
      .select("slug")
      .eq("tenant_id", appUser.tenant_id)
      .eq("is_active", true)
      .order("is_hq", { ascending: false })
      .limit(1)
      .maybeSingle();
    staffBranchSlug = firstBranch?.slug ?? null;
  }

  return {
    onboardingCompleted: staffTenant.onboarding_completed === true,
    subscriptionStatus: staffTenant.subscription_status,
    role: appUser.role,
    isStaff: true,
    defaultBranchSlug: staffBranchSlug,
    ts: Date.now(),
  };
}

function setTenantCacheCookie(
  response: NextResponse,
  payload: TenantCachePayload
): void {
  response.cookies.set(TENANT_CACHE_COOKIE, encodeTenantCache(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TENANT_CACHE_MAX_AGE,
    path: "/",
  });
}

export async function updateSession(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient<Database>(
    request,
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));
  const isSubscriptionPage = pathname.startsWith("/subscription-required");
  const isPwaAsset = pathname === "/manifest.json" || pathname === "/sw.js";
  const isDashboardRoute =
    !isAuthRoute &&
    !isSubscriptionPage &&
    !isPwaAsset &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/check-in") &&
    pathname !== "/" &&
    !pathname.startsWith("/about") &&
    !pathname.startsWith("/contact") &&
    !pathname.startsWith("/careers") &&
    !pathname.startsWith("/help") &&
    !pathname.startsWith("/terms") &&
    !pathname.startsWith("/privacy");

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) {
    return getResponse();
  }

  // Try cached tenant state first, fall back to DB query
  const cachedRaw = request.cookies.get(TENANT_CACHE_COOKIE)?.value;
  let tenantState = cachedRaw ? decodeTenantCache(cachedRaw) : null;

  if (!tenantState) {
    tenantState = await fetchTenantState(supabase, user.id);
    if (tenantState) {
      setTenantCacheCookie(getResponse(), tenantState);
    }
  }

  if (isAuthRoute) {
    if (
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password")
    ) {
      return getResponse();
    }

    if (pathname.startsWith("/login")) {
      if (!tenantState || !tenantState.onboardingCompleted) {
        return getResponse();
      }
    }

    // Authenticated user visiting an auth page — redirect them to the right place
    const url = request.nextUrl.clone();
    if (!tenantState || !tenantState.onboardingCompleted) {
      url.pathname = "/register";
      url.searchParams.set("step", tenantState ? "payment" : "onboarding");
    } else if (
      tenantState.subscriptionStatus === "incomplete" ||
      tenantState.subscriptionStatus === "incomplete_expired"
    ) {
      url.pathname = "/register";
      url.searchParams.set("step", "payment");
    } else if (
      tenantState.subscriptionStatus &&
      !ACTIVE_STATUSES.includes(tenantState.subscriptionStatus)
    ) {
      url.pathname = "/subscription-required";
    } else {
      // Redirect to branch-scoped dashboard instead of flat /dashboard
      const slug = tenantState.defaultBranchSlug;
      url.pathname = slug ? `/${slug}/dashboard` : "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute) {
    if (tenantState?.isStaff) {
      if (
        tenantState.subscriptionStatus &&
        BLOCKED_STATUSES.includes(tenantState.subscriptionStatus)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/subscription-required";
        return NextResponse.redirect(url);
      }
      // Staff with an active tenant can proceed
    } else {
      if (!tenantState || !tenantState.onboardingCompleted) {
        const url = request.nextUrl.clone();
        url.pathname = "/register";
        url.searchParams.set("step", tenantState ? "payment" : "onboarding");
        return NextResponse.redirect(url);
      }

      if (
        tenantState.subscriptionStatus &&
        BLOCKED_STATUSES.includes(tenantState.subscriptionStatus)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/subscription-required";
        return NextResponse.redirect(url);
      }
    }

    // Redirect old flat routes to branch-scoped equivalents
    const matchedOldRoute = OLD_FLAT_ROUTES.find(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
    if (matchedOldRoute && tenantState?.defaultBranchSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantState.defaultBranchSlug}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  if (isSubscriptionPage && tenantState) {
    const subscriptionOk =
      !tenantState.subscriptionStatus ||
      ACTIVE_STATUSES.includes(tenantState.subscriptionStatus);

    if (tenantState.onboardingCompleted && subscriptionOk) {
      const url = request.nextUrl.clone();
      const slug = tenantState.defaultBranchSlug;
      url.pathname = slug ? `/${slug}/dashboard` : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return getResponse();
}
