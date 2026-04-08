/**
 * One-time setup: creates (or updates) the Stripe Customer Portal configuration
 * with subscription updates (plan switching) enabled.
 *
 * Run once:
 *   pnpm --filter @barberpro/web-shop setup:stripe-portal
 *
 * Copy the printed configuration ID into STRIPE_PORTAL_CONFIG_ID in your .env.local
 * and in Vercel environment variables.
 */

import Stripe from "stripe";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("❌  STRIPE_SECRET_KEY is not set. Add it to .env.local first.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" as Parameters<typeof Stripe>[1]["apiVersion"] });

// Price IDs from env or hardcoded fallbacks (live mode)
const STARTER_MONTHLY   = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID          ?? "price_1THIsnBGoz93lNFYgCb8FRBx";
const STARTER_YEARLY    = process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID   ?? "price_1TJkDSBGoz93lNFYuMWAHOjN";
const PRO_MONTHLY       = process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID     ?? "price_1THIsqBGoz93lNFYxSAGPcp2";
const PRO_YEARLY        = process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID ?? "price_1TJkDVBGoz93lNFYcScXNTmr";

// Product IDs (retrieved from the prices in Stripe)
const STARTER_PRODUCT     = "prod_UFoVGYJmJWOnbb";
const PRO_PRODUCT         = "prod_UFoVFSDwN5Guap";

async function main() {
  console.log("🔍  Looking up existing portal configurations…");

  const configs = await stripe.billingPortal.configurations.list({ limit: 10 });

  // Find an existing BarberPro portal config
  const existing = configs.data.find(
    (c) => (c.metadata as Record<string, string>)?.app === "barberpro"
  );

  const featureConfig = {
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end" as const,
        cancellation_reason: {
          enabled: true,
          options: [
            "too_expensive",
            "missing_features",
            "switched_service",
            "unused",
            "other",
          ] as Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionCancel.CancellationReason.Options[],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"] as Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.DefaultAllowedUpdates[],
        proration_behavior: "create_prorations" as const,
        products: [
          {
            product: STARTER_PRODUCT,
            prices: [STARTER_MONTHLY, STARTER_YEARLY],
          },
          {
            product: PRO_PRODUCT,
            prices: [PRO_MONTHLY, PRO_YEARLY],
          },
        ],
      },
    },
    business_profile: {
      privacy_policy_url: "https://barberpro.my/privacy",
      terms_of_service_url: "https://barberpro.my/terms",
    },
    metadata: { app: "barberpro" },
  };

  let config: Stripe.BillingPortal.Configuration;

  if (existing) {
    console.log(`📝  Updating existing config: ${existing.id}`);
    config = await stripe.billingPortal.configurations.update(existing.id, featureConfig);
  } else {
    console.log("✨  Creating new portal configuration…");
    config = await stripe.billingPortal.configurations.create(featureConfig);
  }

  console.log("\n✅  Done!");
  console.log(`\nPortal configuration ID: ${config.id}`);
  console.log("\nAdd this to your .env.local and Vercel environment variables:");
  console.log(`\nSTRIPE_PORTAL_CONFIG_ID=${config.id}`);
}

main().catch((err) => {
  console.error("❌  Failed:", err.message);
  process.exit(1);
});
