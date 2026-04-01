"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Receipt, Sparkles } from "lucide-react";

import {
  createCustomerBillingPortalSession,
  createCustomerPlusCheckoutSession,
  listCustomerInvoicesAction,
  type CustomerInvoiceRow,
} from "@/actions/subscription";
import { CUSTOMER_PLUS_PLAN } from "@/lib/stripe";
import { hasStripeEnv } from "@/lib/env";

type Snapshot = {
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
};

type Props = {
  snapshot: Snapshot;
  stripeConfigured: boolean;
  priceConfigured: boolean;
};

function formatMoney(amountMinor: number, currency: string) {
  const upper = currency.toUpperCase();
  const value = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-MY", { style: "currency", currency: upper }).format(value);
  } catch {
    return `${upper} ${value.toFixed(2)}`;
  }
}

export function SubscriptionClient({ snapshot, stripeConfigured, priceConfigured }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoiceRow[] | null>(null);

  const loadInvoices = useCallback(async () => {
    if (!stripeConfigured) return;
    const res = await listCustomerInvoicesAction();
    if (res.ok) setInvoices(res.invoices);
  }, [stripeConfigured]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  async function checkout() {
    setError(null);
    setLoading("checkout");
    const res = await createCustomerPlusCheckoutSession();
    setLoading(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  async function portal() {
    setError(null);
    setLoading("portal");
    const res = await createCustomerBillingPortalSession();
    setLoading(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  const status = snapshot.subscriptionStatus ?? "none";
  const active = status === "active" || status === "trialing";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {!stripeConfigured && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Stripe is not configured for this app. Add <code className="rounded bg-black/10 px-1">STRIPE_SECRET_KEY</code>{" "}
          to enable memberships.
        </div>
      )}

      {stripeConfigured && !priceConfigured && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Set{" "}
          <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_STRIPE_CUSTOMER_PLUS_PRICE_ID</code> to your Stripe
          Price for BarberPro Plus.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{CUSTOMER_PLUS_PLAN.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Member perks across BarberPro — early queue alerts, exclusive promos from partner shops, and more as we
              roll them out.
            </p>
            <p className="mt-3 text-2xl font-bold text-primary">
              RM {CUSTOMER_PLUS_PLAN.amount}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <p className="mt-1 capitalize">{status.replace(/_/g, " ")}</p>
          </div>
          {snapshot.trialEndsAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trial ends</p>
              <p className="mt-1 text-sm">{new Date(snapshot.trialEndsAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {active && stripeConfigured && snapshot.stripeCustomerId && (
            <button
              type="button"
              onClick={() => void portal()}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Manage billing
            </button>
          )}
          {!active && stripeConfigured && priceConfigured && (
            <button
              type="button"
              onClick={() => void checkout()}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "checkout" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Subscribe with card
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Billing is processed by Stripe. Cancel or update your card anytime from Manage billing. Webhook events for
          renewals are handled by the main BarberPro app webhook endpoint.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Receipt className="h-5 w-5 text-primary" />
          Invoice history
        </h3>
        {!invoices && stripeConfigured && <p className="text-sm text-muted-foreground">Loading…</p>}
        {invoices && invoices.length === 0 && (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        )}
        {invoices && invoices.length > 0 && (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {inv.number ?? inv.id.slice(0, 14)}
                    <span className="ml-2 text-xs capitalize text-muted-foreground">{inv.status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created * 1000).toLocaleDateString("en-MY")} ·{" "}
                    {formatMoney(inv.amountDue, inv.currency)}
                  </p>
                </div>
                {inv.hostedInvoiceUrl && (
                  <a
                    href={inv.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
