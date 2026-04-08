import { createClient } from "@/lib/supabase/server";
import { hasStripeEnv } from "@/lib/env";
import { getStripe, STRIPE_PLANS, type StripePlan } from "@/lib/stripe";
import { planFromStripePriceId } from "@/lib/plan-from-price";

export type ShopBillingSnapshot = {
  tenantId: string;
  planKey: StripePlan | null;
  planLabel: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
};

export async function loadShopBillingSnapshot(): Promise<ShopBillingSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "id, plan, stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_status, trial_ends_at"
    )
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  if (!tenant) return null;

  let currentPeriodEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  if (tenant.stripe_subscription_id && hasStripeEnv()) {
    try {
      const sub = (await getStripe().subscriptions.retrieve(tenant.stripe_subscription_id)) as {
        current_period_end?: number;
        cancel_at_period_end?: boolean;
      };
      if (sub.current_period_end) {
        currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
      }
      if (sub.cancel_at_period_end) {
        cancelAtPeriodEnd = true;
      }
    } catch {
      /* ignore */
    }
  }

  const fromPrice = planFromStripePriceId(tenant.stripe_price_id as string | null);
  const planKey = fromPrice ?? ((tenant.plan as StripePlan) || null);
  const planLabel = planKey ? STRIPE_PLANS[planKey].name : (tenant.plan as string) || "—";

  return {
    tenantId: tenant.id,
    planKey,
    planLabel,
    subscriptionStatus: tenant.subscription_status as string | null,
    trialEndsAt: tenant.trial_ends_at as string | null,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    stripeCustomerId: tenant.stripe_customer_id as string | null,
    stripeSubscriptionId: tenant.stripe_subscription_id as string | null,
    stripePriceId: tenant.stripe_price_id as string | null
  };
}
