import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Idempotency: skip events we've already processed (Stripe retries on failure)
  const { data: existing } = await supabase
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenant_id;

      if (tenantId) {
        await supabase
          .from("tenants")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0]?.price.id,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null
          })
          .eq("id", tenantId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        await supabase
          .from("tenants")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        await supabase
          .from("tenants")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
  }

  // Record event as processed for idempotency
  await supabase
    .from("processed_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });

  return NextResponse.json({ received: true });
}
