import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client for use in Next.js middleware with cookie bridge.
 * Handles session refresh automatically.
 * Returns both the client and the response (which has updated cookies).
 */
export function createMiddlewareClient<T = unknown>(
  request: NextRequest,
  url: string,
  anonKey: string
) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<T>(url, anonKey, {
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
  });

  return { supabase, response: supabaseResponse, getResponse: () => supabaseResponse };
}
