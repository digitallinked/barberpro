"use client";

import { AlertTriangle, ArrowRight, Calendar, CreditCard, Loader2, LogOut, Scissors, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { signOut } from "@/actions/auth";
import { createCheckoutSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlanTier = "starter" | "professional";
type BillingPeriod = "monthly" | "yearly";

const PLANS: {
  id: PlanTier;
  name: string;
  monthly: number;
  yearly: number;
  desc: string;
  popular?: boolean;
}[] = [
  { id: "starter", name: "Starter", monthly: 99, yearly: 990, desc: "1 branch, up to 5 staff" },
  { id: "professional", name: "Professional", monthly: 249, yearly: 2490, desc: "Unlimited branches & staff", popular: true },
];

function SubscriptionRequiredContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isTrialExpired = reason === "trial_expired";

  const [isLoading, setIsLoading] = useState(false);
  const [tier, setTier] = useState<PlanTier>("starter");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [error, setError] = useState<string | null>(null);

  const selectedPlanKey = period === "yearly" ? `${tier}_yearly` as const : tier;

  async function handleSubscribe() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await createCheckoutSession(selectedPlanKey, { intent: "recovery" });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Something went wrong. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  const selectedPlan = PLANS.find((p) => p.id === tier)!;
  const price = period === "yearly" ? selectedPlan.yearly : selectedPlan.monthly;
  const yearlySaving = selectedPlan.monthly * 12 - selectedPlan.yearly;
  const intervalLabel = period === "yearly" ? "/year" : "/month";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <span className="text-lg font-bold text-primary">BarberPro</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20">

          {/* Banner */}
          <div className={cn(
            "flex items-center gap-3 rounded-t-xl border-b px-6 py-4",
            isTrialExpired
              ? "border-amber-500/20 bg-amber-500/10"
              : "border-red-500/20 bg-red-500/10"
          )}>
            <AlertTriangle className={cn("h-5 w-5 flex-shrink-0", isTrialExpired ? "text-amber-400" : "text-red-400")} />
            <div>
              <p className={cn("text-sm font-semibold", isTrialExpired ? "text-amber-400" : "text-red-400")}>
                {isTrialExpired ? "Free trial ended" : "Subscription inactive"}
              </p>
              <p className={cn("text-xs", isTrialExpired ? "text-amber-400/70" : "text-red-400/70")}>
                {isTrialExpired
                  ? "Subscribe to keep your shop active"
                  : "Your access has been suspended"}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isTrialExpired ? "Your trial has ended" : "Reactivate your account"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {isTrialExpired
                  ? "Your 14-day free trial is over. Subscribe now to keep your shop data, staff records, and full access."
                  : "Your BarberPro subscription has ended. Your shop data is safe — resubscribe anytime to regain full access."}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Billing period toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-1">
              {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-all",
                    period === p
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p === "monthly" ? "Monthly" : (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Yearly
                      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        Save 2 months
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Plan selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Choose a plan
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((p) => {
                  const displayPrice = period === "yearly" ? p.yearly : p.monthly;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTier(p.id)}
                      className={cn(
                        "relative rounded-lg border p-3 text-left transition-all",
                        tier === p.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted hover:border-border/80"
                      )}
                    >
                      {p.popular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          Popular
                        </span>
                      )}
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-base font-bold text-primary">
                        RM {displayPrice}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.desc}{period === "monthly" ? "/mo" : "/yr"}</div>
                      {period === "yearly" && (
                        <div className="mt-1 text-[10px] text-primary font-medium">
                          Save RM {p.monthly * 12 - p.yearly}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price summary */}
            <div className="rounded-lg border border-border/50 bg-muted/50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total due today</span>
                <span className="font-bold text-foreground">RM {price}{intervalLabel}</span>
              </div>
              {period === "yearly" && (
                <p className="mt-1 text-xs text-primary">
                  <Zap className="inline h-3 w-3 mr-0.5" />
                  Saving RM {yearlySaving} vs monthly billing
                </p>
              )}
            </div>

            <Button className="w-full" onClick={handleSubscribe} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Stripe…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe &amp; restore access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="border-t border-border/50 pt-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Need help?{" "}
                <a href="mailto:support@barberpro.my" className="text-primary hover:underline">
                  Contact support
                </a>
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Your shop data, staff records, and transaction history are retained for{" "}
          <span className="text-foreground font-medium">90 days</span> after cancellation.
        </p>
      </div>
    </main>
  );
}

export default function SubscriptionRequiredPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      }
    >
      <SubscriptionRequiredContent />
    </Suspense>
  );
}

