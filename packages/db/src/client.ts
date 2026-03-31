import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client (singleton). Uses user session via cookies.
 * RLS applies — data is scoped to the authenticated user's tenant.
 */
export function createBrowserSupabaseClient<T = unknown>(url: string, anonKey: string) {
  if (_client) return _client as ReturnType<typeof createBrowserClient<T>>;
  _client = createBrowserClient<T>(url, anonKey);
  return _client as ReturnType<typeof createBrowserClient<T>>;
}
