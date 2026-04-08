import { STRIPE_PLANS, type StripePlan, type PlanTier } from "@/lib/stripe";

export function planFromStripePriceId(priceId: string | null | undefined): StripePlan | null {
  if (!priceId) return null;
  for (const key of Object.keys(STRIPE_PLANS) as StripePlan[]) {
    if (STRIPE_PLANS[key].priceId === priceId) return key;
  }
  return null;
}

/** Returns just the tier ("starter" | "professional") from a price ID, ignoring billing period. */
export function tierFromStripePriceId(priceId: string | null | undefined): PlanTier | null {
  const plan = planFromStripePriceId(priceId);
  if (!plan) return null;
  return STRIPE_PLANS[plan].tier;
}
