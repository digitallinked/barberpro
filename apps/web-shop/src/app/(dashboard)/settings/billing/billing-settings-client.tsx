"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, CreditCard, ExternalLink, Loader2, Receipt, Zap } from "lucide-react";

import { createBillingPortalSession, listShopInvoicesAction, type ShopInvoiceRow } from "@/actions/billing";
import { createCheckoutSession, type CheckoutIntent } from "@/actions/stripe";
import type { ShopBillingSnapshot } from "@/lib/billing-snapshot";
import { STRIPE_PLANS, type PlanTier, type BillingPeriod } from "@/lib/stripe";
import { cn } from "@/lib/utils";

type Props = {
  snapshot: ShopBillingSnapshot;
  stripeConfigured: boolean;
};

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  starter: ["1 branch", "Up to 5 staff", "Queue & POS", "Appointments & CRM", "Inventory tracking", "Expense management", "Basic payroll", "Basic reports"],
  professional: [
    "Unlimited branches",
    "Unlimited staff",
    "Queue & POS",
    "Appointments & CRM",
    "Advanced analytics & P&L",
    "Advanced commissions",
    "Inventory & expense management",
    "Priority support",
  ],
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    trialing: { label: "Trial", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    past_due: { label: "Past due", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    unpaid: { label: "Unpaid", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    canceled: { label: "Cancelled", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    paused: { label: "Paused", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    none: { label: "Not subscribed", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  };
  const cfg = map[status] ?? { label: status.replace(/_/g, " "), cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function BillingSettingsClient({ snapshot, stripeConfigured }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<ShopInvoiceRow[] | null>(null);
  const initialTier: PlanTier =
    snapshot.planKey === "professional" || snapshot.planKey === "professional_yearly"
      ? "professional"
      : "starter";
  const initialPeriod: BillingPeriod =
    snapshot.planKey === "starter_yearly" || snapshot.planKey === "professional_yearly"
      ? "yearly"
      : "monthly";

  const [tier, setTier] = useState<PlanTier>(initialTier);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod);

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
    if (res.error) { setError(res.error); return; }
    if (res.url) window.location.href = res.url;
  }

  async function startCheckout(intent: CheckoutIntent) {
    setError(null);
    setLoading("checkout");
    const planKey = billingPeriod === "yearly" ? `${tier}_yearly` as const : tier;
    const res = await createCheckoutSession(planKey, { intent });
    setLoading(null);
    if (res.error) { setError(res.error); return; }
    if (res.url) window.location.href = res.url;
  }

  const status = snapshot.subscriptionStatus ?? "none";
  const active = status === "active" || status === "trialing";
  const pastDue = status === "past_due" || status === "unpaid";
  const cancelPending = active && snapshot.cancelAtPeriodEnd;
  // past_due still has a subscription — they need the portal to fix payment, NOT a new checkout
  const canCheckout = !active && !pastDue;
  const daysLeft = trialDaysLeft(snapshot.trialEndsAt);

  const monthlyStarter = STRIPE_PLANS.starter.amount;
  const yearlyStarter = STRIPE_PLANS.starter_yearly.amount;
  const monthlyPro = STRIPE_PLANS.professional.amount;
  const yearlyPro = STRIPE_PLANS.professional_yearly.amount;

  return (
    <div className="space-y-6">
      {!stripeConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Stripe is not configured. Set <code className="rounded bg-black/30 px-1">STRIPE_SECRET_KEY</code> and price
            IDs to enable billing.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Current plan</p>
            <p className="mt-1 text-2xl font-bold text-[#D4AF37]">{snapshot.planLabel}</p>
          </div>
          <StatusPill status={status} />
        </div>

        {/* Trial countdown */}
        {status === "trialing" && daysLeft !== null && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
            <Zap className="h-4 w-4 shrink-0" />
            {daysLeft > 0
              ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining in your free trial.`
              : "Your trial ended — subscription charges will begin soon."}
          </div>
        )}

        {/* Past due alert */}
        {pastDue && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your last payment failed. Update your payment method below to restore full access.
          </div>
        )}

        {/* Cancellation scheduled banner */}
        {cancelPending && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">Cancellation scheduled.</strong> Your subscription has been cancelled and will remain active until{" "}
              {snapshot.currentPeriodEnd
                ? new Date(snapshot.currentPeriodEnd).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "the end of your billing period"}
              . You can reactivate anytime before then.
            </span>
          </div>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {snapshot.currentPeriodEnd && active && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500">
                {status === "trialing" ? "Trial ends" : cancelPending ? "Access until" : "Next billing date"}
              </dt>
              <dd className="mt-1 text-sm text-gray-200">
                {new Date(snapshot.currentPeriodEnd).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
          {snapshot.trialEndsAt && status !== "trialing" && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500">Trial was</dt>
              <dd className="mt-1 text-sm text-gray-400">
                {new Date(snapshot.trialEndsAt).toLocaleDateString("en-MY")}
              </dd>
            </div>
          )}
        </dl>

        {stripeConfigured && (active || pastDue) && snapshot.stripeCustomerId && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
            >
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {pastDue ? "Update payment method" : cancelPending ? "Reactivate or manage subscription" : "Manage subscription & payment"}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Opens Stripe — update card, switch plan, view receipts, or cancel.
            </p>
          </div>
        )}
      </div>

      {/* Subscribe / reactivate */}
      {canCheckout && stripeConfigured && (
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
          <h3 className="text-lg font-semibold text-white">
            {status === "canceled" || status === "none" ? "Subscribe" : "Reactivate your subscription"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Choose your plan. Cancel anytime.
          </p>

          {/* Billing period toggle */}
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-1">
            {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBillingPeriod(p)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-semibold transition-all",
                  billingPeriod === p
                    ? "bg-[#1a1a1a] shadow text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {p === "monthly" ? "Monthly" : (
                  <span className="inline-flex items-center gap-1.5 justify-center">
                    <Calendar className="h-3 w-3" />
                    Yearly
                    <span className="rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                      Save 2 months
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["starter", "professional"] as PlanTier[]).map((t) => {
              const selected = tier === t;
              const price = billingPeriod === "yearly"
                ? (t === "starter" ? yearlyStarter : yearlyPro)
                : (t === "starter" ? monthlyStarter : monthlyPro);
              const saving = t === "starter"
                ? monthlyStarter * 12 - yearlyStarter
                : monthlyPro * 12 - yearlyPro;

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`relative rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {t === "professional" && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-[#111]">
                      Popular
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white capitalize">{t}</p>
                      <p className="mt-0.5 text-lg font-bold text-[#D4AF37]">
                        RM {price}
                        <span className="text-xs font-normal text-gray-400">
                          {billingPeriod === "yearly" ? "/yr" : "/mo"}
                        </span>
                      </p>
                      {billingPeriod === "yearly" && (
                        <p className="text-[11px] text-[#D4AF37]/70">Save RM {saving} vs monthly</p>
                      )}
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />}
                  </div>
                  <ul className="mt-3 space-y-1">
                    {PLAN_FEATURES[t].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#D4AF37]/60" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void startCheckout("billing")}
            disabled={loading !== null}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
          >
            {loading === "checkout" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Continue to Stripe checkout
          </button>
        </div>
      )}

      {/* Invoice history */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Receipt className="h-5 w-5 text-[#D4AF37]" />
          Invoice history
        </h3>
        {!invoices && stripeConfigured && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {invoices && invoices.length === 0 && (
          <p className="text-sm text-gray-500">No invoices yet.</p>
        )}
        {invoices && invoices.length > 0 && (
          <ul className="divide-y divide-white/5">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">
                    {inv.number ?? inv.id.slice(0, 12)}
                    <span
                      className={`ml-2 text-xs capitalize ${
                        inv.status === "paid"
                          ? "text-green-400"
                          : inv.status === "open"
                          ? "text-amber-400"
                          : "text-gray-500"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
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
                    className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
                  >
                    View invoice <ExternalLink className="h-3 w-3" />
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
