import { createMiddlewareClient } from "@barberpro/db/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

const ACTIVE_STATUSES = ["trialing", "active", "past_due"];
const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete_expired", "paused"];

const TENANT_CACHE_COOKIE = "bp_tenant_state";
const TENANT_CACHE_MAX_AGE = 60; // seconds — refresh from DB every 60s

type TenantCachePayload = {
  onboardingCompleted: boolean;
  subscriptionStatus: string | null;
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
  supabase: Awaited<ReturnType<typeof createMiddlewareClient>>["supabase"],
  userId: string
): Promise<TenantCachePayload | null> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("onboarding_completed, subscription_status")
    .eq("owner_auth_id", userId)
    .maybeSingle();

  if (!tenant) return null;

  return {
    onboardingCompleted: tenant.onboarding_completed === true,
    subscriptionStatus: tenant.subscription_status,
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
  const { supabase, getResponse } = createMiddlewareClient(
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
  const isDashboardRoute =
    !isAuthRoute &&
    !isSubscriptionPage &&
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
    if (pathname.startsWith("/register")) {
      return getResponse();
    }

    const url = request.nextUrl.clone();

    if (!tenantState || !tenantState.onboardingCompleted) {
      url.pathname = "/register";
      url.searchParams.set("step", tenantState ? "payment" : "onboarding");
    } else if (
      tenantState.subscriptionStatus &&
      !ACTIVE_STATUSES.includes(tenantState.subscriptionStatus)
    ) {
      url.pathname = "/subscription-required";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute) {
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

  if (isSubscriptionPage && tenantState) {
    const subscriptionOk =
      !tenantState.subscriptionStatus ||
      ACTIVE_STATUSES.includes(tenantState.subscriptionStatus);

    if (tenantState.onboardingCompleted && subscriptionOk) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return getResponse();
}
