import { createClient as createDbClient } from "@barberpro/db/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

export async function createClient() {
  return createDbClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
