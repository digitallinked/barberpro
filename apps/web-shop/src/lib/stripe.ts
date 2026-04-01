import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover"
    });
  }
  return stripeInstance;
}

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "price_1THIsnBGoz93lNFYgCb8FRBx",
    amount: 99,
    currency: "MYR"
  },
  professional: {
    name: "Professional",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ?? "price_1THIsqBGoz93lNFYxSAGPcp2",
    amount: 249,
    currency: "MYR"
  }
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
