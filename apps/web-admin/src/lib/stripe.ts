import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured in web-admin");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return stripeInstance;
}

export function hasStripeEnv(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ??
      "price_1TMkSGBGoz93lNFY6k2hJF0o",
    amount: 69,
    currency: "MYR",
  },
  professional: {
    name: "Professional",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ??
      "price_1TMkSPBGoz93lNFYny3Ndrqs",
    amount: 179,
    currency: "MYR",
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PLANS;
