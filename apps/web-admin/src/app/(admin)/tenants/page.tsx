import { createAdminClient } from "@/lib/supabase/admin";

export default async function TenantsPage() {
  const supabase = createAdminClient();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, status, subscription_status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-400">Failed to load tenants: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">{tenants?.length ?? 0} registered shops</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Shop Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Subscription</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants?.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{tenant.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{tenant.slug}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {tenant.plan ?? "starter"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tenant.status ?? "active"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tenant.subscription_status ?? "none"} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!tenants || tenants.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No tenants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400",
    trialing: "bg-blue-500/10 text-blue-400",
    past_due: "bg-yellow-500/10 text-yellow-400",
    canceled: "bg-red-500/10 text-red-400",
    suspended: "bg-red-500/10 text-red-400",
    unpaid: "bg-red-500/10 text-red-400",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
