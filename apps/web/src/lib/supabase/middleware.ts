import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

// Statuses that grant dashboard access
const ACTIVE_STATUSES = ["trialing", "active", "past_due"];

// Statuses that have fully lost access
const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete_expired", "paused"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
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

  // Unauthenticated user → login
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    // Let authenticated users stay on /register to finish onboarding
    if (pathname.startsWith("/register")) {
      return supabaseResponse;
    }

    // All other auth routes: redirect based on onboarding state
    const { data: tenant } = await supabase
      .from("tenants")
      .select("onboarding_completed, subscription_status")
      .eq("owner_auth_id", user.id)
      .maybeSingle();

    const onboardingDone = tenant?.onboarding_completed === true;
    const subscriptionOk =
      !tenant?.subscription_status ||
      ACTIVE_STATUSES.includes(tenant.subscription_status);

    const url = request.nextUrl.clone();

    if (!onboardingDone) {
      url.pathname = "/register";
      url.searchParams.set("step", tenant ? "payment" : "onboarding");
    } else if (!subscriptionOk) {
      url.pathname = "/subscription-required";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Authenticated user on dashboard routes — check onboarding + subscription
  if (user && isDashboardRoute) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("onboarding_completed, subscription_status")
      .eq("owner_auth_id", user.id)
      .maybeSingle();

    const onboardingDone = tenant?.onboarding_completed === true;
    const isBlocked =
      tenant?.subscription_status &&
      BLOCKED_STATUSES.includes(tenant.subscription_status);

    if (!onboardingDone) {
      const url = request.nextUrl.clone();
      url.pathname = "/register";
      url.searchParams.set("step", tenant ? "payment" : "onboarding");
      return NextResponse.redirect(url);
    }

    if (isBlocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/subscription-required";
      return NextResponse.redirect(url);
    }
  }

  // Authenticated user trying to hit /subscription-required but their sub is actually fine
  if (user && isSubscriptionPage) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("onboarding_completed, subscription_status")
      .eq("owner_auth_id", user.id)
      .maybeSingle();

    const onboardingDone = tenant?.onboarding_completed === true;
    const subscriptionOk =
      !tenant?.subscription_status ||
      ACTIVE_STATUSES.includes(tenant.subscription_status);

    if (onboardingDone && subscriptionOk) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
