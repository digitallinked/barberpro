import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = { params: Promise<{ id: string }> };

export default async function TenantDetailPage({ params }: PageProps) {
  await requireAccess("/tenants");
  const { id } = await params;
  const supabase = createAdminClient();

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
  };

  const { data: raw, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, plan, status, subscription_status, owner_auth_id, onboarding_completed, stripe_customer_id, stripe_subscription_id, stripe_price_id, trial_ends_at, created_at, email"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !raw) {
    notFound();
  }

  const tenant = raw as TenantDetail;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/tenants"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All tenants
        </Link>
        <h1 className="text-2xl font-semibold">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">
          {tenant.slug} · Owner auth ID:{" "}
          <code className="rounded bg-muted px-1 text-xs">{tenant.owner_auth_id}</code>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Account status</p>
          <div className="mt-2">
            <StatusBadge status={tenant.status ?? "active"} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Plan</p>
          <p className="mt-2 text-lg font-semibold capitalize">{tenant.plan ?? "starter"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Subscription</p>
          <div className="mt-2">
            <StatusBadge status={tenant.subscription_status ?? "none"} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Billing &amp; Stripe</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Onboarding complete</dt>
            <dd className="font-medium">{tenant.onboarding_completed ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Shop email</dt>
            <dd className="font-medium">{tenant.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trial ends</dt>
            <dd className="font-medium">
              {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stripe price ID</dt>
            <dd className="break-all font-mono text-xs">{tenant.stripe_price_id ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Stripe customer</dt>
            <dd className="mt-1">
              {tenant.stripe_customer_id ? (
                <a
                  href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {tenant.stripe_customer_id}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Stripe subscription</dt>
            <dd className="mt-1">
              {tenant.stripe_subscription_id ? (
                <a
                  href={`https://dashboard.stripe.com/subscriptions/${tenant.stripe_subscription_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {tenant.stripe_subscription_id}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Plan changes, refunds, and cancellations are performed in the Stripe Dashboard or by the shop owner via the
          Customer Portal from <span className="text-foreground">web-shop</span>.
        </p>
      </div>
    </div>
  );
}
