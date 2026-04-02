import { createBrowserSupabaseClient as createDbBrowserClient } from "@barberpro/db/client";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createBrowserSupabaseClient() {
  return createDbBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
