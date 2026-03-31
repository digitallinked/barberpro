import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components and Server Actions.
 * Uses user session via cookies — RLS applies.
 */
export async function createClient<T = unknown>(url: string, anonKey: string) {
  const cookieStore = await cookies();

  return createServerClient<T>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from Server Component — middleware refreshes session
        }
      }
    }
  });
}
