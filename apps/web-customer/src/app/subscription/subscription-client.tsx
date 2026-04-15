"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  createCustomerBillingPortalSession,
  createCustomerPlusCheckoutSession,
  listCustomerInvoicesAction,
  type CustomerInvoiceRow,
} from "@/actions/subscription";
import { CUSTOMER_PLUS_PLAN } from "@/lib/stripe";

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
  errorMessage?: string | null;
  wasCanceled?: boolean;
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

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "On trial",
  past_due: "Past due",
  unpaid: "Unpaid",
  canceled: "Cancelled",
  paused: "Paused",
  none: "Not subscribed",
};

const STATUS_PILL: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  trialing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  past_due: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  unpaid: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
};

const PLUS_FEATURES = [
  "Priority queue position at partner shops",
  "Exclusive member-only promotions",
  "Early access to new features",
  "Queue progress notifications",
];

export function SubscriptionClient({
  snapshot,
  stripeConfigured,
  priceConfigured,
  errorMessage,
  wasCanceled,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(errorMessage ?? null);
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
    if (res.error) { setError(res.error); return; }
    if (res.url) window.location.href = res.url;
  }

  async function portal() {
    setError(null);
    setLoading("portal");
    const res = await createCustomerBillingPortalSession();
    setLoading(null);
    if (res.error) { setError(res.error); return; }
    if (res.url) window.location.href = res.url;
  }

  const status = snapshot.subscriptionStatus ?? "none";
  const active = status === "active" || status === "trialing";
  const pastDue = status === "past_due" || status === "unpaid";
  const daysLeft = trialDaysLeft(snapshot.trialEndsAt);
  const statusLabel = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  const statusCls = STATUS_PILL[status] ?? STATUS_PILL.none!;

  return (
    <div className="space-y-8">
      {!stripeConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            Payments are not enabled on this app. Add{" "}
            <code className="rounded bg-black/10 px-1">STRIPE_SECRET_KEY</code> to enable memberships.
          </span>
        </div>
      )}

      {stripeConfigured && !priceConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>BarberPro Plus is not yet available in your region. Check back soon.</span>
        </div>
      )}

      {wasCanceled && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Checkout was cancelled. No charge was made.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Membership card */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">{CUSTOMER_PLUS_PLAN.name}</h2>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Member perks across all BarberPro partner shops.
            </p>
            <p className="mt-3 text-2xl font-bold text-primary">
              RM {CUSTOMER_PLUS_PLAN.amount}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
        </div>

        {/* Feature list */}
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {PLUS_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        {/* Trial info */}
        {status === "trialing" && daysLeft !== null && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-300">
            <Zap className="h-4 w-4 shrink-0" />
            {daysLeft > 0
              ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your free trial.`
              : "Your trial has ended. You'll be charged at the next billing cycle."}
          </div>
        )}

        {/* Past due alert */}
        {pastDue && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your last payment failed. Please update your payment method.
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {(active || pastDue) && stripeConfigured && snapshot.stripeCustomerId && (
            <button
              type="button"
              onClick={() => void portal()}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {pastDue ? "Update payment method" : "Manage billing"}
            </button>
          )}
          {!active && !pastDue && stripeConfigured && priceConfigured && (
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
              {status === "canceled" ? "Resubscribe" : "Start free trial"}
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Payments are securely processed by Stripe. Cancel anytime from Manage billing, no questions asked.
        </p>
      </div>

      {/* Invoice history */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Receipt className="h-5 w-5 text-primary" />
          Invoice history
        </h3>
        {!invoices && stripeConfigured && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
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
                    <span
                      className={`ml-2 text-xs capitalize ${
                        inv.status === "paid" ? "text-green-500" : "text-muted-foreground"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created * 1000).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {formatMoney(inv.amountDue, inv.currency)}
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
