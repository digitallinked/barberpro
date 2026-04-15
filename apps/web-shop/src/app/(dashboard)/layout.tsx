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
    // getCurrentTenant resolves auth + tenant + branch in one cached call (React cache())
    const tenantCtx = await getCurrentTenant();
    if (!tenantCtx) {
      redirect("/login");
    }

    const isOwner = tenantCtx.userRole === "owner";

    if (isOwner) {
      // Onboarding check — uses onboardingCompleted already fetched inside getCurrentTenant
      if (!tenantCtx.onboardingCompleted) {
        redirect(`/register?step=payment`);
      }

      const isDbOnlyTrialing =
        tenantCtx.subscriptionStatus === "trialing" &&
        !tenantCtx.stripeSubscriptionId &&
        tenantCtx.trialEndsAt &&
        new Date(tenantCtx.trialEndsAt) < new Date();

      if (isDbOnlyTrialing) {
        // Mark trial as expired — use admin client since this is a system action
        const supabase = await createClient();
        await supabase
          .from("tenants")
          .update({ subscription_status: "canceled" })
          .eq("id", tenantCtx.tenantId);
        redirect("/subscription-required?reason=trial_expired");
      }

      if (
        tenantCtx.subscriptionStatus &&
        BLOCKED_STATUSES.includes(tenantCtx.subscriptionStatus)
      ) {
        redirect("/subscription-required");
      }
    } else {
      // Staff: only block if the tenant's subscription is fully blocked
      if (
        tenantCtx.subscriptionStatus &&
        BLOCKED_STATUSES.includes(tenantCtx.subscriptionStatus)
      ) {
        redirect("/subscription-required");
      }
    }

    return (
      <LanguageProvider initialLanguage={tenantCtx.preferredLanguage}>
        <TenantProvider value={tenantCtx}>
          {isOwner && tenantCtx.subscriptionStatus === "trialing" && tenantCtx.trialEndsAt && !tenantCtx.stripeSubscriptionId && (
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
