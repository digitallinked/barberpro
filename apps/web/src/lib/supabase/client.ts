import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/lib/env";

/**
 * Lazily initialize Supabase only when env vars are present.
 * This allows the UI shell to run before backend setup is done.
 */
export const supabaseClient = hasSupabaseEnv()
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  : null;
