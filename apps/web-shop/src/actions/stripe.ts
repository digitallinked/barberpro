"use server";

import type Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getStripe, STRIPE_PLANS, type StripePlan } from "@/lib/stripe";
import { planFromStripePriceId, tierFromStripePriceId } from "@/lib/plan-from-price";

export type CheckoutIntent = "onboarding" | "billing" | "recovery";

export async function createCheckoutSession(
  plan: StripePlan,
  options?: { intent?: CheckoutIntent }
) {
  const supabase = await createClient();
  const stripe = getStripe();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, stripe_customer_id, name, email, subscription_status, stripe_subscription_id, trial_ends_at")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  if (!tenant) {
    return { error: "Shop details not found. Please complete the onboarding first." };
  }

  // Block if already has an active Stripe subscription (not just a DB-only trial)
  const activeStates = ["active", "trialing"];
  if (
    activeStates.includes((tenant.subscription_status as string) ?? "") &&
    tenant.stripe_subscription_id
  ) {
    return {
      error:
        "You already have an active subscription. Use Billing to change your plan or update your payment method."
    };
  }

  let customerId = tenant.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? tenant.email ?? undefined,
      name: tenant.name,
      metadata: {
        tenant_id: tenant.id,
        user_id: user.id
      }
    });
    customerId = customer.id;

    await supabase.from("tenants").update({ stripe_customer_id: customerId }).eq("id", tenant.id);
  }

  const selectedPlan = STRIPE_PLANS[plan];
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const intent = options?.intent ?? "onboarding";

  // Only apply trial in Stripe if the tenant hasn't already used their DB trial
  // (i.e. no trial_ends_at set, meaning they went straight to payment without the no-card trial)
  const hasUsedDbTrial = Boolean((tenant as Record<string, unknown>).trial_ends_at);
  const useTrial =
    !hasUsedDbTrial &&
    (!tenant.subscription_status ||
      tenant.subscription_status === "incomplete" ||
      tenant.subscription_status === "incomplete_expired");

  const planTier = selectedPlan.tier;
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: {
      tenant_id: tenant.id,
      user_id: user.id,
      plan: planTier
    }
  };
  if (useTrial) {
    subscriptionData.trial_period_days = 14;
  }

  let successUrl = `${appUrl}/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}`;
  let cancelUrl = `${appUrl}/register?step=payment&canceled=true`;

  if (intent === "billing") {
    successUrl = `${appUrl}/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent("/settings/billing")}`;
    cancelUrl = `${appUrl}/settings/billing?checkout=canceled`;
  } else if (intent === "recovery") {
    successUrl = `${appUrl}/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}`;
    cancelUrl = `${appUrl}/subscription-required?checkout=canceled`;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    line_items: [
      {
        price: selectedPlan.priceId,
        quantity: 1
      }
    ],
    subscription_data: subscriptionData,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenant_id: tenant.id,
      user_id: user.id,
      plan: planTier
    }
  });

  return { url: session.url };
}

export async function finalizeSubscription(sessionId: string) {
  const supabase = await createClient();
  const stripe = getStripe();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  if (session.status !== "complete") {
    return { error: "Payment not completed" };
  }

  const subscription = session.subscription as import("stripe").Stripe.Subscription;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  if (!tenant) return { error: "Tenant not found" };

  const metaPlan = subscription.metadata?.plan;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const inferredTier = tierFromStripePriceId(priceId);
  const planValue =
    metaPlan === "starter" || metaPlan === "professional" || metaPlan === "enterprise"
      ? metaPlan
      : inferredTier;

  await supabase
    .from("tenants")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      onboarding_completed: true,
      ...(planValue ? { plan: planValue } : {})
    })
    .eq("id", tenant.id);

  return { success: true };
}
