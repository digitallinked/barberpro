import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { TenantProvider } from "@/components/tenant-provider";
import { TrialBanner } from "@/components/trial-banner";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/queries";

const BLOCKED_STATUSES = ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"];

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
      .select("onboarding_completed, subscription_status, trial_ends_at, stripe_subscription_id")
      .eq("owner_auth_id", user!.id)
      .maybeSingle();

    if (!tenant?.onboarding_completed) {
      const step = tenant ? "payment" : "onboarding";
      redirect(`/register?step=${step}`);
    }

    // Expire DB-only trials that have passed their end date
    const tenantAny = tenant as Record<string, unknown>;
    const trialEndsAt = tenantAny.trial_ends_at as string | null;
    const stripeSubId = tenantAny.stripe_subscription_id as string | null;
    const isDbOnlyTrialing =
      tenant.subscription_status === "trialing" &&
      !stripeSubId &&
      trialEndsAt &&
      new Date(trialEndsAt) < new Date();

    if (isDbOnlyTrialing) {
      // Trial has expired — mark as canceled and redirect to paywall
      await supabase
        .from("tenants")
        .update({ subscription_status: "canceled" })
        .eq("owner_auth_id", user.id);
      redirect("/subscription-required?reason=trial_expired");
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
          {tenantCtx.subscriptionStatus === "trialing" && tenantCtx.trialEndsAt && !tenantCtx.stripeSubscriptionId && (
            <TrialBanner
              trialEndsAt={tenantCtx.trialEndsAt}
              stripeSubscriptionId={tenantCtx.stripeSubscriptionId}
            />
          )}
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
