import { Activity, Building2, CreditCard, TrendingDown, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { ChartCard } from "@/components/chart-card";
import { TenantGrowthChart, PlanDistributionChart } from "@/components/dashboard-charts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

function groupByMonth(dates: string[]): { month: string; count: number }[] {
  const now = new Date();
  const months: { month: string; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("en", { month: "short" }),
      count: 0,
    });
  }

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (monthsAgo >= 0 && monthsAgo < 12) {
      const idx = 11 - monthsAgo;
      if (months[idx]) months[idx].count++;
    }
  }

  return months;
}

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    tenantsResult,
    usersResult,
    activeResult,
    trialingResult,
    canceledThisMonthResult,
    newThisMonthResult,
    allTenantsResult,
    recentTenantsResult,
  ] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("app_users").select("id", { count: "exact", head: true }),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("subscription_status", "trialing"),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("subscription_status", "canceled").gte("updated_at", startOfLastMonth).lt("updated_at", startOfMonth),
    supabase.from("tenants").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    supabase.from("tenants").select("created_at, plan, subscription_status").order("created_at", { ascending: true }),
    supabase.from("tenants").select("id, name, plan, subscription_status, email, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const totalTenants = tenantsResult.count ?? 0;
  const totalUsers = usersResult.count ?? 0;
  const activeCount = activeResult.count ?? 0;
  const trialingCount = trialingResult.count ?? 0;
  const canceledThisMonth = canceledThisMonthResult.count ?? 0;
  const newThisMonth = newThisMonthResult.count ?? 0;

  type TenantRow = { created_at: string; plan: string | null; subscription_status: string | null };
  const allTenants = (allTenantsResult.data ?? []) as TenantRow[];

  const monthlyData = groupByMonth(allTenants.map((t) => t.created_at));

  const planCounts = allTenants.reduce(
    (acc, t) => {
      const plan = t.plan ?? "starter";
      acc[plan] = (acc[plan] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const planData = [
    { name: "starter", value: planCounts["starter"] ?? 0, color: "hsl(215 13% 50%)" },
    { name: "basic", value: planCounts["basic"] ?? 0, color: "hsl(199 89% 48%)" },
    { name: "pro", value: planCounts["pro"] ?? 0, color: "hsl(225 70% 60%)" },
    { name: "enterprise", value: planCounts["enterprise"] ?? 0, color: "hsl(270 70% 60%)" },
  ];

  type RecentTenant = { id: string; name: string; plan: string | null; subscription_status: string | null; email: string | null; created_at: string };
  const recentTenants = (recentTenantsResult.data ?? []) as RecentTenant[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Dashboard"
        description="Live platform metrics and business health"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Tenants"
          value={totalTenants}
          icon={Building2}
          trend={{ value: `+${newThisMonth}`, direction: "up", label: "this month" }}
        />
        <StatCard
          label="Active Subscriptions"
          value={activeCount}
          icon={CreditCard}
          accent="success"
        />
        <StatCard
          label="Trialing"
          value={trialingCount}
          icon={Activity}
          accent="info"
        />
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
        />
        <StatCard
          label="New This Month"
          value={newThisMonth}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Churned Last Month"
          value={canceledThisMonth}
          icon={TrendingDown}
          accent={canceledThisMonth > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Tenant Growth"
          description="New tenants per month (last 12 months)"
          className="lg:col-span-2"
        >
          <TenantGrowthChart data={monthlyData} />
        </ChartCard>

        <ChartCard title="Plan Distribution" description="All tenants by plan">
          <PlanDistributionChart data={planData} />
        </ChartCard>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold">Recent Signups</h2>
          <Link href="/tenants" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentTenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link href={`/tenants/${tenant.id}`} className="font-medium hover:text-primary transition-colors">
                  {tenant.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {tenant.email ?? "no email"} · <span className="capitalize">{tenant.plan ?? "starter"}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={tenant.subscription_status ?? "none"} />
                <p className="text-xs text-muted-foreground">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {recentTenants.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No tenants yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
