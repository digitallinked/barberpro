"use server";

import type Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { env, hasStripeEnv } from "@/lib/env";
import { CUSTOMER_PLUS_PLAN, getStripe } from "@/lib/stripe";

export type CustomerInvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  created: number;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
};

export async function createCustomerPlusCheckoutSession() {
  if (!hasStripeEnv()) {
    return { error: "Payments are not configured." };
  }
  if (!CUSTOMER_PLUS_PLAN.priceId) {
    return { error: "BarberPro Plus is not configured (missing price ID)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to subscribe." };

  const db = supabase as any;
  const { data: row } = await db
    .from("customer_accounts")
    .select(
      "id, stripe_customer_id, email, full_name, subscription_status, stripe_subscription_id"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const account = row as {
    id: string;
    stripe_customer_id: string | null;
    email: string | null;
    full_name: string | null;
    subscription_status: string | null;
    stripe_subscription_id: string | null;
  } | null;

  if (!account) return { error: "Customer profile not found." };

  const active = ["active", "trialing"].includes(account.subscription_status ?? "");
  if (active && account.stripe_subscription_id) {
    return {
      error: "You already have an active membership. Use Manage billing to change or cancel.",
    };
  }

  const stripe = getStripe();
  let customerId = account.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? account.email ?? undefined,
      name: account.full_name ?? undefined,
      metadata: {
        customer_account_id: account.id,
        auth_user_id: user.id,
      },
    });
    customerId = customer.id;
    await db.from("customer_accounts").update({ stripe_customer_id: customerId }).eq("id", account.id);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const useTrial =
    !account.subscription_status ||
    account.subscription_status === "incomplete" ||
    account.subscription_status === "incomplete_expired";

  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: {
      customer_account_id: account.id,
      auth_user_id: user.id,
      subscription_plan: CUSTOMER_PLUS_PLAN.key,
    },
  };
  if (useTrial) {
    subscriptionData.trial_period_days = 7;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: CUSTOMER_PLUS_PLAN.priceId, quantity: 1 }],
    subscription_data: subscriptionData,
    success_url: `${appUrl}/auth/stripe-success?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent("/subscription")}`,
    cancel_url: `${appUrl}/subscription?checkout=canceled`,
    metadata: {
      customer_account_id: account.id,
      auth_user_id: user.id,
    },
  });

  return { url: session.url };
}

export async function createCustomerBillingPortalSession() {
  if (!hasStripeEnv()) {
    return { error: "Payments are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to continue." };

  const db = supabase as any;
  const { data: row } = await db
    .from("customer_accounts")
    .select("stripe_customer_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const customerId = row?.stripe_customer_id as string | null;
  if (!customerId) {
    return { error: "No billing profile yet. Start a subscription first." };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/subscription`,
  });

  return { url: session.url };
}

export async function finalizeCustomerPlusSubscription(sessionId: string) {
  if (!hasStripeEnv()) {
    return { error: "Payments are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.status !== "complete") {
    return { error: "Payment not completed" };
  }

  // Verify the Checkout session was created for this user to prevent one user
  // from writing their Stripe IDs into another user's account.
  const sessionUserId = session.metadata?.auth_user_id;
  if (!sessionUserId || sessionUserId !== user.id) {
    return { error: "Session does not belong to the current user." };
  }

  const subscription = session.subscription as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  const db = supabase as any;
  const { data: row } = await db
    .from("customer_accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const accountId = row?.id as string | undefined;
  if (!accountId) return { error: "Customer profile not found" };

  const patch: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    subscription_status: subscription.status,
    subscription_plan: CUSTOMER_PLUS_PLAN.key,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };
  if (customerId) patch.stripe_customer_id = customerId;

  await db.from("customer_accounts").update(patch).eq("id", accountId);

  return { success: true as const };
}

export async function listCustomerInvoicesAction(): Promise<
  { ok: true; invoices: CustomerInvoiceRow[] } | { ok: false; error: string }
> {
  if (!hasStripeEnv()) {
    return { ok: false, error: "Payments are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const db = supabase as any;
  const { data: row } = await db
    .from("customer_accounts")
    .select("stripe_customer_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const customerId = row?.stripe_customer_id as string | null;
  if (!customerId) return { ok: true, invoices: [] };

  const list = await getStripe().invoices.list({ customer: customerId, limit: 24 });
  const invoices: CustomerInvoiceRow[] = list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    created: inv.created,
    amountDue: inv.amount_due,
    currency: inv.currency,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
  }));

  return { ok: true, invoices };
}
