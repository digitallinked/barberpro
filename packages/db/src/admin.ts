import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client that bypasses RLS.
 * ONLY use for: webhooks, public API routes, super-admin queries.
 * NEVER use in dashboard routes — it would expose all tenants' data.
 */
export function createAdminClient<T = unknown>(url: string, serviceRoleKey: string) {
  return createClient<T>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
