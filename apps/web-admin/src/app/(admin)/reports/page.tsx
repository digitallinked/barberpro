import { Building2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { ChartCard } from "@/components/chart-card";
import { TenantGrowthLineChart } from "@/components/reports-charts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{ range?: string }>;
};

function buildCumulativeMonthly(
  tenants: { created_at: string; subscription_status: string | null }[],
  months: number
): { month: string; total: number; active: number }[] {
  const now = new Date();
  const result: { month: string; total: number; active: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const boundary = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString("en", { month: "short", year: "2-digit" });

    const inRange = tenants.filter((t) => new Date(t.created_at) <= boundary);
    const activeInRange = inRange.filter((t) =>
      ["active", "trialing"].includes(t.subscription_status ?? "")
    );

    result.push({ month: label, total: inRange.length, active: activeInRange.length });
  }

  return result;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireAccess("/reports");
  const { range = "12" } = await searchParams;
  const months = range === "6" ? 6 : range === "3" ? 3 : 12;

  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const since = new Date(now.getFullYear(), now.getMonth() - months, 1).toISOString();

  const [tenantsResult, usersResult, topTenantsResult] = await Promise.all([
    supabase
      .from("tenants")
      .select("created_at, subscription_status, plan, name, id, slug")
      .gte("created_at", since)
      .order("created_at"),
    supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    supabase
      .from("tenants")
      .select("id, name, slug, plan, subscription_status")
      .in("subscription_status", ["active"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  type TenantRow = { created_at: string; subscription_status: string | null; plan: string | null; name: string; id: string; slug: string };
  const tenants = (tenantsResult.data ?? []) as TenantRow[];
  const newUsersThisMonth = usersResult.count ?? 0;
  const topTenants = (topTenantsResult.data ?? []) as TenantRow[];

  const chartData = buildCumulativeMonthly(tenants, months);

  const planBreakdown = tenants.reduce(
    (acc, t) => {
      const p = t.plan ?? "starter";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const RANGES = [
    { label: "3M", value: "3" },
    { label: "6M", value: "6" },
    { label: "12M", value: "12" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Reports"
        description="Cross-tenant usage analytics and growth trends"
      >
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/reports?range=${r.value}`}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tenants in Period" value={tenants.length} icon={Building2} />
        <StatCard
          label="Active Subscriptions"
          value={tenants.filter((t) => t.subscription_status === "active").length}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Trialing"
          value={tenants.filter((t) => t.subscription_status === "trialing").length}
          accent="info"
        />
        <StatCard label="New Users This Month" value={newUsersThisMonth} icon={Users} />
      </div>

      <ChartCard
        title="Tenant Growth"
        description={`Cumulative total vs. active tenants (${months} months)`}
      >
        <TenantGrowthLineChart data={chartData} />
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-primary inline-block" /> Total tenants
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-green-400 inline-block" /> Active tenants
          </div>
        </div>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan breakdown */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Plan Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(planBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([plan, count]) => {
                const pct = Math.round((count / tenants.length) * 100) || 0;
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{plan}</span>
                      <span className="tabular-nums text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(planBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground">No data for this period</p>
            )}
          </div>
        </div>

        {/* Top active tenants */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Active Tenants</h3>
          <div className="space-y-2">
            {topTenants.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/tenants/${t.id}`} className="font-medium hover:text-primary transition-colors truncate block">
                    {t.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </div>
                <StatusBadge status={t.subscription_status ?? "none"} />
              </div>
            ))}
            {topTenants.length === 0 && (
              <p className="text-sm text-muted-foreground">No active tenants yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
