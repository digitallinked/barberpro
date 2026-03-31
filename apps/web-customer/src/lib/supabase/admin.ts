import { createAdminClient as createDbAdmin } from "@barberpro/db/admin";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin client is not configured");
  }

  return createDbAdmin<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
