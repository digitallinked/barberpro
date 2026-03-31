import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const [tenantsResult, usersResult, activeResult] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("app_users").select("id", { count: "exact", head: true }),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .in("subscription_status", ["active", "trialing"]),
  ]);

  const totalTenants = tenantsResult.count ?? 0;
  const totalUsers = usersResult.count ?? 0;
  const activeSubscriptions = activeResult.count ?? 0;

  const { data: recentTenants } = await supabase
    .from("tenants")
    .select("id, name, plan, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live platform metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total Tenants" value={totalTenants} />
        <MetricCard label="Active Subscriptions" value={activeSubscriptions} />
        <MetricCard label="Total Users" value={totalUsers} />
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent Tenants</h2>
        </div>
        <div className="divide-y divide-border">
          {recentTenants?.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tenant.plan ?? "starter"} &middot; {tenant.subscription_status ?? "no subscription"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(tenant.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {(!recentTenants || recentTenants.length === 0) && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tenants yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
