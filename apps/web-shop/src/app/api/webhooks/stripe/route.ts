import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import {
  subscriptionStartedEmail,
  subscriptionRenewedEmail,
  paymentFailedEmail,
  subscriptionCancelledEmail,
  planChangedEmail,
  trialEndingEmail,
  upcomingRenewalEmail,
  cardExpiredEmail,
} from "@/lib/email/templates";
import { getStripe } from "@/lib/stripe";
import { syncStripeSubscriptionToDatabase } from "@/lib/stripe-subscription-sync";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMyr(amount: number | null | undefined, currency = "MYR"): string {
  if (!amount) return "RM 0.00";
  const inRinggit = amount / 100;
  return `RM ${inRinggit.toFixed(2)}`;
}

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function inferPlanLabel(sub: Stripe.Subscription): string {
  const meta = sub.metadata?.plan;
  if (meta) return meta;
  const priceId = sub.items.data[0]?.price?.id ?? "";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID) return "professional";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) return "starter";
  return "starter";
}

function billingUrl(): string {
  return `${(env.NEXT_PUBLIC_APP_URL ?? "https://shop.barberpro.my").replace(/\/$/, "")}/settings/billing`;
}

interface SubscriberEmailInfo {
  email: string;
  ownerName: string;
  shopName: string;
  /** "tenant" = barber shop owner (web-shop), "customer" = end consumer (web-customer) */
  kind: "tenant" | "customer";
}

async function getSubscriberEmailInfo(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
): Promise<SubscriberEmailInfo | null> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  // ── 1. End-consumer (BarberPro Plus) via customer_account_id metadata ──────
  const metaCustomerAccountId = subscription.metadata?.customer_account_id;
  if (metaCustomerAccountId) {
    const { data: account } = await (supabase as any)
      .from("customer_accounts")
      .select("email, full_name, auth_user_id")
      .eq("id", metaCustomerAccountId)
      .maybeSingle();

    if (account) {
      let email = account.email as string | null;
      if (account.auth_user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(account.auth_user_id as string);
        if (authUser?.user?.email) email = authUser.user.email;
      }
      if (email) {
        return {
          email,
          ownerName: (account.full_name as string) ?? "Valued Member",
          shopName: "BarberPro Plus",
          kind: "customer",
        };
      }
    }
  }

  // ── 2. End-consumer fallback: look up by stripe_customer_id ────────────────
  if (customerId && !subscription.metadata?.tenant_id) {
    const { data: accountRow } = await (supabase as any)
      .from("customer_accounts")
      .select("email, full_name, auth_user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (accountRow) {
      let email = accountRow.email as string | null;
      if (accountRow.auth_user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(accountRow.auth_user_id as string);
        if (authUser?.user?.email) email = authUser.user.email;
      }
      if (email) {
        return {
          email,
          ownerName: (accountRow.full_name as string) ?? "Valued Member",
          shopName: "BarberPro Plus",
          kind: "customer",
        };
      }
    }
  }

  // ── 3. Barber shop owner via tenant_id metadata ─────────────────────────────
  const metaTenantId = subscription.metadata?.tenant_id;
  let tenantId: string | null = metaTenantId ?? null;

  if (!tenantId && customerId) {
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    tenantId = data?.id ?? null;
  }

  if (!tenantId) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("email, name, owner_auth_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return null;

  let email = tenant.email as string | null;
  if (tenant.owner_auth_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(tenant.owner_auth_id as string);
    if (authUser?.user?.email) email = authUser.user.email;
  }

  if (!email) return null;

  return {
    email,
    ownerName: (tenant.name as string) ?? "Shop Owner",
    shopName: (tenant.name as string) ?? "your shop",
    kind: "tenant",
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency guard
  const { data: existing } = await supabase
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncStripeSubscriptionToDatabase(supabase, subscription);

        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const isTrial = subscription.status === "trialing";
          const trialEndsAt = isTrial && subscription.trial_end
            ? formatDate(subscription.trial_end)
            : undefined;

          const tpl = subscriptionStartedEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            trialEndsAt,
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Subscription created ────────────────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscriptionToDatabase(supabase, subscription);

        // Only send if not already sent via checkout.session.completed
        // (checkout.session.completed is the primary trigger; this is a fallback
        // for API-driven subscriptions that skip checkout)
        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const isTrial = subscription.status === "trialing";
          const trialEndsAt = isTrial && subscription.trial_end
            ? formatDate(subscription.trial_end)
            : undefined;

          const tpl = subscriptionStartedEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            trialEndsAt,
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Subscription updated (plan change, cancel-at-period-end, etc.) ──────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;
        await syncStripeSubscriptionToDatabase(supabase, subscription);

        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (!info) break;

        const newPlan = inferPlanLabel(subscription);
        const newPriceId = subscription.items.data[0]?.price?.id ?? "";

        // Detect plan change
        const prevItems = previous?.items as Stripe.ApiList<Stripe.SubscriptionItem> | undefined;
        const prevPriceId = prevItems?.data?.[0]?.price?.id;
        if (prevPriceId && prevPriceId !== newPriceId) {
          const oldPlan =
            prevPriceId === process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID
              ? "professional"
              : "starter";
          const tpl = planChangedEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            oldPlan,
            newPlan,
            newAmount: formatMyr(subscription.items.data[0]?.price?.unit_amount),
            effectiveDate: new Date().toLocaleDateString("en-MY", {
              day: "numeric", month: "long", year: "numeric",
            }),
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Subscription deleted (cancelled) ────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscriptionToDatabase(supabase, subscription);

        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const subAny = subscription as unknown as { current_period_end?: number };
          const accessUntil = subAny.current_period_end
            ? formatDate(subAny.current_period_end)
            : "immediately";

          const tpl = subscriptionCancelledEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            accessUntil,
            reactivateUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Invoice payment succeeded (renewal receipt) ─────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null | undefined)?.id;

        if (!subId) break;

        await supabase
          .from("tenants")
          .update({ subscription_status: "active" })
          .eq("stripe_subscription_id", subId);

        // Don't send receipt for the very first invoice (checkout.session.completed handles it)
        const billingReason = (invoice as Stripe.Invoice & { billing_reason?: string }).billing_reason;
        if (billingReason === "subscription_create") break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const subAny = subscription as unknown as { current_period_end?: number };
          const tpl = subscriptionRenewedEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            amountPaid: formatMyr(invoice.amount_paid),
            nextBillingDate: formatDate(subAny.current_period_end),
            invoiceUrl: (invoice as Stripe.Invoice & { hosted_invoice_url?: string | null }).hosted_invoice_url ?? undefined,
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Invoice payment failed ───────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null | undefined)?.id;

        if (!subId) break;

        await supabase
          .from("tenants")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", subId);

        const subscription = await stripe.subscriptions.retrieve(subId);
        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const nextRetry = (invoice as Stripe.Invoice & { next_payment_attempt?: number | null }).next_payment_attempt;
          const tpl = paymentFailedEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            amountDue: formatMyr(invoice.amount_due),
            retryDate: nextRetry ? formatDate(nextRetry) : undefined,
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Trial ending soon (3 days before) ───────────────────────────────────
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const trialEnd = subscription.trial_end ?? 0;
          const daysLeft = Math.max(
            1,
            Math.ceil((trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          );
          const tpl = trialEndingEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            trialEndsAt: formatDate(trialEnd),
            daysLeft,
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Upcoming renewal notice ──────────────────────────────────────────────
      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null | undefined)?.id;
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const info = await getSubscriberEmailInfo(supabase, subscription);
        if (info) {
          const plan = inferPlanLabel(subscription);
          const tpl = upcomingRenewalEmail({
            ownerName: info.ownerName,
            shopName: info.shopName,
            plan,
            amount: formatMyr(invoice.amount_due),
            renewalDate: formatDate(
              (invoice as Stripe.Invoice & { period_end?: number }).period_end
            ),
            billingUrl: billingUrl(),
          });
          await sendEmail({ to: info.email, subject: tpl.subject, html: tpl.html });
        }
        break;
      }

      // ── Payment method / card expired or detached ────────────────────────────
      case "payment_method.automatically_updated":
      case "customer.updated": {
        const obj = event.data.object as Stripe.PaymentMethod | Stripe.Customer;
        const customerId =
          "customer" in obj
            ? (typeof obj.customer === "string" ? obj.customer : obj.customer?.id)
            : (obj as Stripe.Customer).id;

        if (!customerId) break;

        const card =
          "card" in obj && (obj as Stripe.PaymentMethod).card
            ? (obj as Stripe.PaymentMethod).card
            : null;

        // Try tenants first, then customer_accounts
        let recipientEmail: string | null = null;
        let recipientName = "Shop Owner";
        let recipientShop = "your shop";

        const { data: tenant } = await supabase
          .from("tenants")
          .select("email, name, owner_auth_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (tenant) {
          recipientEmail = tenant.email as string | null;
          if (tenant.owner_auth_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(tenant.owner_auth_id as string);
            if (authUser?.user?.email) recipientEmail = authUser.user.email;
          }
          recipientName = (tenant.name as string) ?? "Shop Owner";
          recipientShop = (tenant.name as string) ?? "your shop";
        } else {
          const { data: account } = await (supabase as any)
            .from("customer_accounts")
            .select("email, full_name, auth_user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (account) {
            recipientEmail = account.email as string | null;
            if (account.auth_user_id) {
              const { data: authUser } = await supabase.auth.admin.getUserById(account.auth_user_id as string);
              if (authUser?.user?.email) recipientEmail = authUser.user.email;
            }
            recipientName = (account.full_name as string) ?? "Valued Member";
            recipientShop = "BarberPro Plus";
          }
        }

        if (!recipientEmail) break;

        const tpl = cardExpiredEmail({
          ownerName: recipientName,
          shopName: recipientShop,
          last4: card?.last4 ?? undefined,
          billingUrl: billingUrl(),
        });
        await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
        break;
      }

      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  await supabase
    .from("processed_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });

  return NextResponse.json({ received: true });
}
