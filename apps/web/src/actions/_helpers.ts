"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, tenant_id, branch_id, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!appUser?.tenant_id) throw new Error("No tenant");

  return { supabase, user, appUser, tenantId: appUser.tenant_id, appUserId: appUser.id };
}
