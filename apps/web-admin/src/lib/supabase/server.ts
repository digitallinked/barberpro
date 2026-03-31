import { createClient as createDbClient } from "@barberpro/db/server";

import { env } from "@/lib/env";

export async function createClient() {
  return createDbClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
