"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { headers } from "next/headers";

/**
 * Checks whether the currently authenticated customer is also registered as a
 * shop staff / owner in `app_users`, and if so generates a one-time Supabase
 * magic-link that will sign them into the shop dashboard without requiring a
 * second login.
 *
 * Returns the Supabase action_link URL on success, or an error string.
 */
export async function getShopDashboardSsoUrl(): Promise<
  { url: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Not authenticated" };
  }

  // Verify the user has an active app_users row (shop staff / owner).
  const { data: appUser } = await (supabase as any)
    .from("app_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!appUser) {
    return { error: "Not a shop user" };
  }

  // redirectTo must stay on the customer-app domain so Supabase auto-allows it.
  // Resolve from current request host first (more reliable than env across
  // preview/prod), then fall back to NEXT_PUBLIC_APP_URL.
  const reqHeaders = await headers();
  const forwardedHost = reqHeaders.get("x-forwarded-host");
  const forwardedProto = reqHeaders.get("x-forwarded-proto") ?? "https";
  const derivedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const customerAppUrl = (derivedOrigin ?? env.NEXT_PUBLIC_APP_URL).replace(/\/$/, "");
  const redirectTo = `${customerAppUrl}/auth/shop-handoff`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    console.error("[shop-access] generateLink error:", error?.message);
    return { error: "Failed to generate shop access link" };
  }

  // Ensure redirect_to is present even if provider defaults override options.
  const actionLink = new URL(data.properties.action_link);
  actionLink.searchParams.set("redirect_to", redirectTo);

  return { url: actionLink.toString() };
}
