import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { TenantProvider } from "@/components/tenant-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/queries";

const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete_expired", "paused"];

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
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

    const tenantCtx = await getCurrentTenant();
    if (!tenantCtx) {
      redirect("/login");
    }

    return (
      <LanguageProvider initialLanguage={tenantCtx.preferredLanguage}>
        <TenantProvider value={tenantCtx}>
          <AppShell>{children}</AppShell>
        </TenantProvider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider initialLanguage="ms">
      <AppShell>{children}</AppShell>
    </LanguageProvider>
  );
}
