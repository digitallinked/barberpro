"use server";

import { createClient } from "@/lib/supabase/server";
import { env, hasStripeEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export type ShopInvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  created: number;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
};

export async function createBillingPortalSession(returnPath?: string) {
  if (!hasStripeEnv()) {
    return { error: "Billing is not configured" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  const customerId = tenant?.stripe_customer_id as string | null;
  if (!customerId) {
    return { error: "No Stripe customer on file. Complete a subscription checkout first." };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const path =
    returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//")
      ? returnPath
      : "/settings/billing";
  const returnUrl = `${appUrl}${path}`;

  const stripe = getStripe();

  const sessionParams: Parameters<typeof stripe.billingPortal.sessions.create>[0] = {
    customer: customerId,
    return_url: returnUrl,
  };

  if (env.STRIPE_PORTAL_CONFIG_ID) {
    sessionParams.configuration = env.STRIPE_PORTAL_CONFIG_ID;
  }

  const session = await stripe.billingPortal.sessions.create(sessionParams);

  return { url: session.url };
}

export async function listShopInvoicesAction(): Promise<
  { ok: true; invoices: ShopInvoiceRow[] } | { ok: false; error: string }
> {
  if (!hasStripeEnv()) {
    return { ok: false, error: "Billing is not configured" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_customer_id")
    .eq("owner_auth_id", user.id)
    .maybeSingle();

  const customerId = tenant?.stripe_customer_id as string | null;
  if (!customerId) {
    return { ok: true, invoices: [] };
  }

  const stripe = getStripe();
  const list = await stripe.invoices.list({ customer: customerId, limit: 24 });

  const invoices: ShopInvoiceRow[] = list.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    created: inv.created,
    amountDue: inv.amount_due,
    currency: inv.currency,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null
  }));

  return { ok: true, invoices };
}
