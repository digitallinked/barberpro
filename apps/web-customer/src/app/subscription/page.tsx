import Link from "next/link";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { SubscriptionClient } from "@/app/subscription/subscription-client";
import { createClient } from "@/lib/supabase/server";
import { CUSTOMER_PLUS_PLAN } from "@/lib/stripe";
import { hasStripeEnv } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{ error?: string; checkout?: string }>;
};

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/subscription");
  }

  const { data: row } = await (supabase as any)
    .from("customer_accounts")
    .select("subscription_status, subscription_plan, trial_ends_at, stripe_customer_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const snapshot = {
    subscriptionStatus: (row?.subscription_status as string | null) ?? null,
    subscriptionPlan: (row?.subscription_plan as string | null) ?? null,
    trialEndsAt: (row?.trial_ends_at as string | null) ?? null,
    stripeCustomerId: (row?.stripe_customer_id as string | null) ?? null,
  };

  const { error: errorParam, checkout } = await searchParams;
  const wasCanceled = checkout === "canceled";
  const errorMessage = errorParam ? decodeURIComponent(errorParam) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <Link href="/profile" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              ← Back to profile
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Membership</h1>
            <p className="text-sm text-muted-foreground">
              Manage your BarberPro Plus subscription, invoices, and billing details.
            </p>
          </div>

          <SubscriptionClient
            snapshot={snapshot}
            stripeConfigured={hasStripeEnv()}
            priceConfigured={Boolean(CUSTOMER_PLUS_PLAN.priceId)}
            errorMessage={errorMessage}
            wasCanceled={wasCanceled}
          />
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6">
        <div className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} barberpro.my. Billing powered by{" "}
          <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Stripe
          </a>
          .
        </div>
      </footer>
    </div>
  );
}
