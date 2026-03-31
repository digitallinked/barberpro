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

  if (user && !isLoginPage) {
    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

    if (!isSuperAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
