import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Legacy price IDs from before the June 2026 pricing update (RM99/RM249 era).
const LEGACY_STARTER_PRICE_IDS = new Set([
  "price_1THIsnBGoz93lNFYgCb8FRBx",
  "price_1TJkDSBGoz93lNFYuMWAHOjN",
]);
const LEGACY_PRO_PRICE_IDS = new Set([
  "price_1THIsqBGoz93lNFYxSAGPcp2",
  "price_1TJkDVBGoz93lNFYcScXNTmr",
]);

function inferTenantPlanFromEnvPrice(priceId: string | null): string | null {
  if (!priceId) return null;
  const starter = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
  const pro = process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID;
  const starterYearly = process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID;
  const proYearly = process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID;
  if (starter && priceId === starter) return "starter";
  if (pro && priceId === pro) return "professional";
  if (starterYearly && priceId === starterYearly) return "starter";
  if (proYearly && priceId === proYearly) return "professional";
  // Fall back to legacy price IDs so existing subscribers are not misclassified
  if (LEGACY_STARTER_PRICE_IDS.has(priceId)) return "starter";
  if (LEGACY_PRO_PRICE_IDS.has(priceId)) return "professional";
  return null;
}

function isTenantPlan(p: string): boolean {
  return p === "starter" || p === "professional" || p === "enterprise";
}

/**
 * Mirrors Stripe subscription state into `tenants` or `customer_accounts`.
 * Used by the platform webhook (shop app URL) for both shop SaaS and consumer plans.
 */
export async function syncStripeSubscriptionToDatabase(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const metaTenant = subscription.metadata?.tenant_id;
  const metaCustomerAccount = subscription.metadata?.customer_account_id;
  const planMeta = subscription.metadata?.plan;
  const consumerPlan = subscription.metadata?.subscription_plan ?? "plus";

  const base = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_status: subscription.status,
    trial_ends_at: trialEnd
  };

  const tenantPlanPatch: { plan?: string } = {};
  if (planMeta && isTenantPlan(planMeta)) {
    tenantPlanPatch.plan = planMeta;
  } else {
    const inferred = inferTenantPlanFromEnvPrice(priceId);
    if (inferred) tenantPlanPatch.plan = inferred;
  }

  if (metaTenant) {
    await supabase.from("tenants").update({ ...base, ...tenantPlanPatch }).eq("id", metaTenant);
    return;
  }

  if (metaCustomerAccount) {
    await (supabase as any)
      .from("customer_accounts")
      .update({
        ...base,
        subscription_plan: consumerPlan
      })
      .eq("id", metaCustomerAccount);
    return;
  }

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (tenantRow) {
    await supabase.from("tenants").update({ ...base, ...tenantPlanPatch }).eq("id", tenantRow.id);
    return;
  }

  const { data: custRow } = await (supabase as any)
    .from("customer_accounts")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (custRow) {
    await (supabase as any)
      .from("customer_accounts")
      .update({
        ...base,
        subscription_plan: consumerPlan
      })
      .eq("id", custRow.id);
  }
}
