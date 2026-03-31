"use server";

import { resolveAuthContext, type AuthContext } from "@barberpro/auth";

import { createClient } from "@/lib/supabase/server";

export type { AuthContext };

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  return resolveAuthContext(supabase);
}
