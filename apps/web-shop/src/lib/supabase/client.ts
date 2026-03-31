import { createBrowserSupabaseClient } from "@barberpro/db/client";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient() {
  return createBrowserSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}
