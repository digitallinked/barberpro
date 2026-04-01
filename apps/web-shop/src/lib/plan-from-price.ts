import { STRIPE_PLANS, type StripePlan } from "@/lib/stripe";

export function planFromStripePriceId(priceId: string | null | undefined): StripePlan | null {
  if (!priceId) return null;
  for (const key of Object.keys(STRIPE_PLANS) as StripePlan[]) {
    if (STRIPE_PLANS[key].priceId === priceId) return key;
  }
  return null;
}
