import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["trialing", "active", "past_due"];
const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete_expired", "paused"];

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("onboarding_completed, subscription_status")
      .eq("owner_auth_id", user!.id)
      .maybeSingle();

    if (!tenant?.onboarding_completed) {
      const step = tenant ? "payment" : "onboarding";
      redirect(`/register?step=${step}`);
    }

    if (
      tenant?.subscription_status &&
      BLOCKED_STATUSES.includes(tenant.subscription_status)
    ) {
      redirect("/subscription-required");
    }
  }

  return <AppShell>{children}</AppShell>;
}
