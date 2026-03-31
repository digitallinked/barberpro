import { createBrowserSupabaseClient as createDbBrowserClient } from "@barberpro/db/client";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient() {
  return createDbBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const createBrowserSupabaseClient = createBrowserClient;
