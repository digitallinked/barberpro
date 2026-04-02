import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type TenantBillingRow = {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
};

type CustomerBillingRow = {
  id: string;
  full_name: string;
  email: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{ status?: string; tab?: string }>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  await requireAccess("/billing");
  const { status: filterStatus, tab = "shops" } = await searchParams;
  const supabase = createAdminClient();

  const [shopsRes, customersRes] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "id, name, slug, plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_accounts")
      .select(
        "id, full_name, email, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at"
      )
      .order("created_at", { ascending: false }),
  ]);

  const allShops = (shopsRes.data ?? []) as TenantBillingRow[];
  const allCustomers = (customersRes.data ?? []) as CustomerBillingRow[];

  const shops = filterStatus
    ? allShops.filter((s) => (s.subscription_status ?? "none") === filterStatus)
    : allShops;
  const customers = filterStatus
    ? allCustomers.filter((c) => (c.subscription_status ?? "none") === filterStatus)
    : allCustomers;

  const shopActive = allShops.filter((s) => ["active", "trialing"].includes(s.subscription_status ?? "")).length;
  const shopAtRisk = allShops.filter((s) => ["past_due", "unpaid"].includes(s.subscription_status ?? "")).length;
  const shopCanceled = allShops.filter((s) => s.subscription_status === "canceled").length;
  const consumerActive = allCustomers.filter((c) => ["active", "trialing"].includes(c.subscription_status ?? "")).length;

  const SHOP_STATUSES = ["active", "trialing", "past_due", "unpaid", "canceled", "none"] as const;

  function buildFilterUrl(status: string | null) {
    const params = new URLSearchParams();
    if (tab !== "shops") params.set("tab", tab);
    if (status) params.set("status", status);
    const q = params.toString();
    return `/billing${q ? `?${q}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing &amp; subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Live view of Stripe state synced via webhooks. Click any shop for detail or open Stripe for
          refunds, disputes, and manual adjustments.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={buildFilterUrl("active")}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-green-500/50"
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">Active shops</p>
          <p className="mt-2 text-3xl font-bold text-green-500">{shopActive}</p>
          <p className="text-xs text-muted-foreground">active or trialing</p>
        </Link>
        <Link
          href={buildFilterUrl("past_due")}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-amber-500/50"
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">At risk</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{shopAtRisk}</p>
          <p className="text-xs text-muted-foreground">past_due or unpaid</p>
        </Link>
        <Link
          href={buildFilterUrl("canceled")}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
        >
          <p className="text-xs font-medium uppercase text-muted-foreground">Churned shops</p>
          <p className="mt-2 text-3xl font-bold">{shopCanceled}</p>
          <p className="text-xs text-muted-foreground">canceled subscriptions</p>
        </Link>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Plus members</p>
          <p className="mt-2 text-3xl font-bold text-primary">{consumerActive}</p>
          <p className="text-xs text-muted-foreground">active or trialing</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(["shops", "consumers"] as const).map((t) => (
          <Link
            key={t}
            href={`/billing?tab=${t}${filterStatus ? `&status=${filterStatus}` : ""}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "shops" ? "Barber shops" : "Consumer Plus"}
          </Link>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildFilterUrl(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !filterStatus
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          All
        </Link>
        {SHOP_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildFilterUrl(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filterStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {/* Shops table */}
      {tab !== "consumers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Barber shops</h2>
            <span className="text-sm text-muted-foreground">{shops.length} shops</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Shop</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Subscription</th>
                  <th className="px-4 py-3 text-left font-medium">Trial ends</th>
                  <th className="px-4 py-3 text-left font-medium">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shops.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${t.id}`} className="font-medium text-primary hover:underline">
                        {t.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{t.plan ?? "starter"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.subscription_status ?? "none"} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.stripe_customer_id ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${t.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Customer <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No shops match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumers table */}
      {tab === "consumers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">BarberPro Plus members</h2>
            <span className="text-sm text-muted-foreground">{customers.length} members</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Rows appear after a customer starts a checkout session or a webhook syncs their Stripe data.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{c.subscription_plan ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.subscription_status ?? "none"} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.stripe_customer_id ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${c.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Customer <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No members match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
