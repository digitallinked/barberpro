import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
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

export default async function BillingPage() {
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

  const shops = (shopsRes.data ?? []) as TenantBillingRow[];
  const customers = (customersRes.data ?? []) as CustomerBillingRow[];

  const shopActive = shops.filter((s) =>
    ["active", "trialing"].includes(s.subscription_status ?? "")
  ).length;
  const shopAtRisk = shops.filter((s) => ["past_due", "unpaid"].includes(s.subscription_status ?? "")).length;
  const consumerActive = customers.filter((c) =>
    ["active", "trialing"].includes(c.subscription_status ?? "")
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Billing &amp; subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Mirrors of Stripe state in Supabase. Open Stripe for refunds, manual adjustments, and disputes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Shop SaaS — paying</p>
          <p className="mt-2 text-3xl font-bold text-primary">{shopActive}</p>
          <p className="text-xs text-muted-foreground">active or trialing</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Shop SaaS — at risk</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{shopAtRisk}</p>
          <p className="text-xs text-muted-foreground">past_due or unpaid</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Consumer Plus</p>
          <p className="mt-2 text-3xl font-bold">{consumerActive}</p>
          <p className="text-xs text-muted-foreground">active or trialing memberships</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Barber shops (SaaS)</h2>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No tenants
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Consumers (BarberPro Plus)</h2>
        <p className="text-xs text-muted-foreground">
          Rows appear after a customer starts checkout or has Stripe IDs synced from webhooks.
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
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No customer accounts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
