import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, GitBranch, Users } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { suspendTenant, unsuspendTenant } from "../actions";

type PageProps = { params: Promise<{ id: string }> };

type TenantDetail = {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  status: string | null;
  subscription_status: string | null;
  owner_auth_id: string;
  onboarding_completed: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  email: string | null;
  preferred_language: string | null;
  timezone: string | null;
};

type Branch = { id: string; name: string; is_hq: boolean; is_active: boolean; created_at: string };
type AppUser = { id: string; full_name: string; email: string | null; role: string; is_active: boolean };

export default async function TenantDetailPage({ params }: PageProps) {
  const role = await requireAccess("/tenants");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: rawData, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, plan, status, subscription_status, owner_auth_id, onboarding_completed, stripe_customer_id, stripe_subscription_id, stripe_price_id, trial_ends_at, created_at, email, preferred_language, timezone"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !rawData) notFound();

  const tenant = rawData as unknown as TenantDetail;

  const [branchesResult, usersResult] = await Promise.all([
    supabase.from("branches").select("id, name, is_hq, is_active, created_at").eq("tenant_id", id).order("created_at"),
    supabase.from("app_users").select("id, full_name, email, role, is_active").eq("tenant_id", id).order("created_at"),
  ]);

  const branches = (branchesResult.data ?? []) as Branch[];
  const users = (usersResult.data ?? []) as AppUser[];

  const isSuspended = tenant.status === "suspended";
  const suspendAction = isSuspended ? unsuspendTenant : suspendTenant;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/tenants"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All tenants
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tenant.slug} · {tenant.email ?? "no email"}
            </p>
          </div>
          {role === "super_admin" && (
            <form action={suspendAction as (formData: FormData) => void}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isSuspended
                    ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}
              >
                {isSuspended ? "Reactivate Account" : "Suspend Account"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</p>
          <div className="mt-2"><StatusBadge status={tenant.status ?? "active"} /></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</p>
          <p className="mt-2 text-lg font-semibold capitalize">{tenant.plan ?? "starter"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subscription</p>
          <div className="mt-2"><StatusBadge status={tenant.subscription_status ?? "none"} /></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Onboarding</p>
          <p className="mt-2 text-sm font-medium">
            {tenant.onboarding_completed ? "✓ Complete" : "⏳ Pending"}
          </p>
        </div>
      </div>

      {/* Two-col detail grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Billing & Stripe */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Billing &amp; Stripe</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Trial ends</dt>
              <dd className="font-medium text-right">
                {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleString() : "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Stripe price ID</dt>
              <dd className="break-all font-mono text-xs text-right">{tenant.stripe_price_id ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Stripe customer</dt>
              <dd>
                {tenant.stripe_customer_id ? (
                  <a
                    href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    {tenant.stripe_customer_id.slice(0, 18)}…
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Stripe subscription</dt>
              <dd>
                {tenant.stripe_subscription_id ? (
                  <a
                    href={`https://dashboard.stripe.com/subscriptions/${tenant.stripe_subscription_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    {tenant.stripe_subscription_id.slice(0, 18)}…
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Plan changes, refunds, and cancellations are managed in the Stripe Dashboard or by the owner via Customer Portal.
          </p>
        </div>

        {/* Account info */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Account Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Timezone</dt>
              <dd className="font-medium">{tenant.timezone ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Language</dt>
              <dd className="font-medium uppercase">{tenant.preferred_language ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Registered</dt>
              <dd className="font-medium">{new Date(tenant.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Owner Auth ID</dt>
              <dd className="break-all font-mono text-xs">{tenant.owner_auth_id.slice(0, 20)}…</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Branches */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Branches</h2>
          <span className="ml-auto text-xs text-muted-foreground">{branches.length}</span>
        </div>
        <div className="divide-y divide-border">
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{branch.name}</span>
                {branch.is_hq && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">HQ</span>
                )}
              </div>
              <span className={`text-xs ${branch.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                {branch.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
          {branches.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">No branches yet</p>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Users</h2>
          <span className="ml-auto text-xs text-muted-foreground">{users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{user.full_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{user.email ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${user.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
