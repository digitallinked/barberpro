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

export type PlanTier = "starter" | "professional";
export type BillingPeriod = "monthly" | "yearly";

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    tier: "starter" as PlanTier,
    period: "monthly" as BillingPeriod,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "price_1THIsnBGoz93lNFYgCb8FRBx",
    amount: 99,
    currency: "MYR",
    interval: "month" as const
  },
  professional: {
    name: "Professional",
    tier: "professional" as PlanTier,
    period: "monthly" as BillingPeriod,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ?? "price_1THIsqBGoz93lNFYxSAGPcp2",
    amount: 249,
    currency: "MYR",
    interval: "month" as const
  },
  starter_yearly: {
    name: "Starter",
    tier: "starter" as PlanTier,
    period: "yearly" as BillingPeriod,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID ?? "price_1TJkDSBGoz93lNFYuMWAHOjN",
    amount: 990,
    currency: "MYR",
    interval: "year" as const
  },
  professional_yearly: {
    name: "Professional",
    tier: "professional" as PlanTier,
    period: "yearly" as BillingPeriod,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID ?? "price_1TJkDVBGoz93lNFYcScXNTmr",
    amount: 2490,
    currency: "MYR",
    interval: "year" as const
  }
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
