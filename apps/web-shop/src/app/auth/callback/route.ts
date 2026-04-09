import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Link invited staff: if the user has user_metadata with app_user_id,
      // attach their auth ID to the existing app_users row.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata ?? {};
        const appUserId = meta.app_user_id as string | undefined;
        if (appUserId) {
          await supabase
            .from("app_users")
            .update({ auth_user_id: user.id })
            .eq("id", appUserId)
            .is("auth_user_id", null);
        } else {
          // Fallback: try linking by email via DB function
          const email = user.email;
          if (email) {
            await supabase.rpc("link_auth_user_by_email", { p_email: email });
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
