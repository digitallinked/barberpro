import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return stripeInstance;
}

/** Consumer membership on barberpro.my — create a recurring Price in Stripe and set the env ID. */
export const CUSTOMER_PLUS_PLAN = {
  key: "plus" as const,
  name: "BarberPro Plus",
  priceId: env.NEXT_PUBLIC_STRIPE_CUSTOMER_PLUS_PRICE_ID ?? "",
  amount: 19,
  currency: "MYR",
};
