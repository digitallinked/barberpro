"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PLANS, type StripePlan } from "@/lib/stripe";

export async function createCheckoutSession(plan: StripePlan) {
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
    .select("id, stripe_customer_id, name, email")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  if (!tenant) {
    return { error: "Shop details not found. Please complete the onboarding first." };
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

    await supabase
      .from("tenants")
      .update({ stripe_customer_id: customerId })
      .eq("id", tenant.id);
  }

  const selectedPlan = STRIPE_PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: selectedPlan.priceId,
        quantity: 1
      }
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        tenant_id: tenant.id,
        user_id: user.id,
        plan
      }
    },
    success_url: `${appUrl}/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/register?step=payment&canceled=true`,
    metadata: {
      tenant_id: tenant.id,
      user_id: user.id,
      plan
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

  await supabase
    .from("tenants")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      onboarding_completed: true
    })
    .eq("id", tenant.id);

  return { success: true };
}
