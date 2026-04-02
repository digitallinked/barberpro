import Link from "next/link";
import { Building2, ExternalLink, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type TenantTableRow = {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  status: string | null;
  subscription_status: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string | null;
};

type PageProps = {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>;
};

export default async function TenantsPage({ searchParams }: PageProps) {
  await requireAccess("/tenants");
  const { q, plan: planFilter, status: statusFilter } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("tenants")
    .select("id, name, slug, plan, status, subscription_status, created_at, stripe_customer_id, stripe_subscription_id, email")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (planFilter) {
    query = query.eq("plan", planFilter);
  }
  if (statusFilter) {
    query = query.eq("subscription_status", statusFilter);
  }

  const { data: tenantRows, error } = await query;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-400">Failed to load tenants: {error.message}</p>
      </div>
    );
  }

  const tenants = (tenantRows ?? []) as TenantTableRow[];

  const activeCount = tenants.filter((t) => t.subscription_status === "active").length;
  const trialingCount = tenants.filter((t) => t.subscription_status === "trialing").length;
  const suspendedCount = tenants.filter((t) => t.status === "suspended").length;

  const PLANS = ["starter", "basic", "pro", "enterprise"];
  const STATUSES = ["active", "trialing", "past_due", "canceled", "none"];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenants"
        description={`${tenants.length} registered barber shops`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={activeCount} accent="success" />
        <StatCard label="Trialing" value={trialingCount} accent="info" />
        <StatCard label="Suspended" value={suspendedCount} accent={suspendedCount > 0 ? "destructive" : "default"} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, slug, email…"
            className="h-9 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/tenants"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !planFilter && !statusFilter && !q
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            All
          </Link>
          {PLANS.map((p) => (
            <Link
              key={p}
              href={`/tenants?plan=${p}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                planFilter === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/tenants?status=${s}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shop</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subscription</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stripe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="group hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tenants/${tenant.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                    {tenant.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{tenant.email ?? tenant.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {tenant.plan ?? "starter"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tenant.status ?? "active"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tenant.subscription_status ?? "none"} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {tenant.stripe_customer_id ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Stripe <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No tenants found"
            description={q ? `No results for "${q}"` : "No tenants match the current filter"}
            className="border-t border-border"
          />
        )}
      </div>
    </div>
  );
}
