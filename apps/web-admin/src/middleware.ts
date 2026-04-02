import { createMiddlewareClient } from "@barberpro/db/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return;
  }

  const { supabase, getResponse } = createMiddlewareClient(
    request,
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: role } = await supabase.rpc("get_admin_role");

    if (!role) {
      if (!isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
      // Non-admin on login page: stay and show the error, don't loop
      return getResponse();
    }

    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Attach the role as a request header so server components can read it
    // via `headers()` without a second DB call.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-role", role as string);
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Forward any session cookies refreshed by Supabase
    getResponse()
      .cookies.getAll()
      .forEach((cookie) => response.cookies.set(cookie));

    return response;
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
