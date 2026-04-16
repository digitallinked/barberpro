import { STRIPE_PLANS, type StripePlan, type PlanTier } from "@/lib/stripe";

// Legacy price IDs from before the June 2026 pricing update (RM99/RM249).
// Kept here so existing subscribers on old prices continue to resolve correctly
// during and after migration to new prices (RM69/RM179).
const LEGACY_PRICE_MAP: Record<string, StripePlan> = {
  "price_1THIsnBGoz93lNFYgCb8FRBx": "starter",
  "price_1TJkDSBGoz93lNFYuMWAHOjN": "starter_yearly",
  "price_1THIsqBGoz93lNFYxSAGPcp2": "professional",
  "price_1TJkDVBGoz93lNFYcScXNTmr": "professional_yearly",
};

export function planFromStripePriceId(priceId: string | null | undefined): StripePlan | null {
  if (!priceId) return null;
  for (const key of Object.keys(STRIPE_PLANS) as StripePlan[]) {
    if (STRIPE_PLANS[key].priceId === priceId) return key;
  }
  return LEGACY_PRICE_MAP[priceId] ?? null;
}

/** Returns just the tier ("starter" | "professional") from a price ID, ignoring billing period. */
export function tierFromStripePriceId(priceId: string | null | undefined): PlanTier | null {
  const plan = planFromStripePriceId(priceId);
  if (!plan) return null;
  return STRIPE_PLANS[plan].tier;
}
