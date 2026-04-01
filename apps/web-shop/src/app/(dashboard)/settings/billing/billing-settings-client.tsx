"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Receipt } from "lucide-react";

import { createBillingPortalSession, listShopInvoicesAction, type ShopInvoiceRow } from "@/actions/billing";
import { createCheckoutSession, type CheckoutIntent } from "@/actions/stripe";
import type { ShopBillingSnapshot } from "@/lib/billing-snapshot";
import { STRIPE_PLANS, type StripePlan } from "@/lib/stripe";

type Props = {
  snapshot: ShopBillingSnapshot;
  stripeConfigured: boolean;
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

export function BillingSettingsClient({ snapshot, stripeConfigured }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<ShopInvoiceRow[] | null>(null);
  const [plan, setPlan] = useState<StripePlan>("starter");

  const loadInvoices = useCallback(async () => {
    if (!stripeConfigured) return;
    const res = await listShopInvoicesAction();
    if (res.ok) setInvoices(res.invoices);
  }, [stripeConfigured]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  async function openPortal() {
    setError(null);
    setLoading("portal");
    const res = await createBillingPortalSession("/settings/billing");
    setLoading(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  async function startCheckout(intent: CheckoutIntent) {
    setError(null);
    setLoading("checkout");
    const res = await createCheckoutSession(plan, { intent });
    setLoading(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  const status = snapshot.subscriptionStatus ?? "none";
  const active = status === "active" || status === "trialing";
  const canCheckout = !active;

  return (
    <div className="space-y-6">
      {!stripeConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Stripe is not configured in this environment. Set{" "}
          <code className="rounded bg-black/30 px-1">STRIPE_SECRET_KEY</code> and price IDs to enable
          billing.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <h3 className="text-lg font-semibold text-white">Current plan</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Plan</p>
            <p className="mt-1 text-xl font-bold text-[#D4AF37]">{snapshot.planLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Subscription status</p>
            <p className="mt-1 font-medium capitalize text-white">{status.replace(/_/g, " ")}</p>
          </div>
          {snapshot.trialEndsAt && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Trial ends</p>
              <p className="mt-1 text-sm text-gray-300">
                {new Date(snapshot.trialEndsAt).toLocaleString()}
              </p>
            </div>
          )}
          {snapshot.currentPeriodEnd && active && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Current period ends</p>
              <p className="mt-1 text-sm text-gray-300">
                {new Date(snapshot.currentPeriodEnd).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {stripeConfigured && snapshot.stripeCustomerId && (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
            >
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Manage subscription &amp; payment
            </button>
          )}
          <p className="w-full text-xs text-gray-500">
            Opens Stripe Customer Portal — update card, switch between Starter and Professional, view
            receipts, or cancel.
          </p>
        </div>
      </div>

      {canCheckout && stripeConfigured && (
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
          <h3 className="text-lg font-semibold text-white">Subscribe or reactivate</h3>
          <p className="mt-1 text-sm text-gray-400">
            Choose a plan and complete checkout. Trials apply only on your first successful subscription.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(Object.keys(STRIPE_PLANS) as StripePlan[]).map((key) => {
              const p = STRIPE_PLANS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlan(key)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    plan === key
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-[#D4AF37]">
                    RM {p.amount}/mo
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => void startCheckout("billing")}
            disabled={loading !== null}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-50"
          >
            {loading === "checkout" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue to secure checkout
          </button>
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Receipt className="h-5 w-5 text-[#D4AF37]" />
          Invoice history
        </h3>
        {!invoices && stripeConfigured && (
          <p className="text-sm text-gray-500">Loading invoices…</p>
        )}
        {invoices && invoices.length === 0 && (
          <p className="text-sm text-gray-500">No invoices yet.</p>
        )}
        {invoices && invoices.length > 0 && (
          <ul className="divide-y divide-white/10">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">
                    {inv.number ?? inv.id.slice(0, 12)}
                    <span className="ml-2 text-xs capitalize text-gray-500">{inv.status}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(inv.created * 1000).toLocaleDateString("en-MY")} ·{" "}
                    {formatMoney(inv.amountDue, inv.currency)}
                  </p>
                </div>
                {inv.hostedInvoiceUrl && (
                  <a
                    href={inv.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
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
