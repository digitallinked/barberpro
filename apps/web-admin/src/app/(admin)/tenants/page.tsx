import Link from "next/link";

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
};

export default async function TenantsPage() {
  await requireAccess("/tenants");
  const supabase = createAdminClient();

  const { data: tenantRows, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, plan, status, subscription_status, created_at, stripe_customer_id, stripe_subscription_id"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-400">Failed to load tenants: {error.message}</p>
      </div>
    );
  }

  const tenants = (tenantRows ?? []) as TenantTableRow[];

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
              <th className="px-4 py-3 text-left font-medium">Stripe</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants?.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/tenants/${tenant.id}`} className="text-primary hover:underline">
                    {tenant.name}
                  </Link>
                </td>
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
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {tenant.stripe_customer_id ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Customer
                    </a>
                  ) : (
                    "—"
                  )}
                  {tenant.stripe_subscription_id ? (
                    <>
                      <br />
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${tenant.stripe_subscription_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Subscription
                      </a>
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!tenants || tenants.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
