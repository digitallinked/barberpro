"use client";

import { AlertTriangle, ArrowRight, CreditCard, Loader2, LogOut, Scissors } from "lucide-react";
import { useState } from "react";

import { signOut } from "@/actions/auth";
import { createCheckoutSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";

export default function SubscriptionRequiredPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<"starter" | "professional">("starter");
  const [error, setError] = useState<string | null>(null);

  async function handleResubscribe() {
    setError(null);
    setIsLoading(true);
    const result = await createCheckoutSession(plan, { intent: "recovery" });
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  async function handleSignOut() {
    await signOut();
  }

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

          {/* Warning banner */}
          <div className="flex items-center gap-3 rounded-t-xl border-b border-red-500/20 bg-red-500/10 px-6 py-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">Subscription inactive</p>
              <p className="text-xs text-red-400/70">Your access has been suspended</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Reactivate your account
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Your BarberPro subscription has ended. Your shop data is safe — resubscribe anytime to regain full access.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Plan selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Choose a plan
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "starter" as const, name: "Starter", price: "RM 99", desc: "1 branch, up to 5 staff" },
                    { id: "professional" as const, name: "Professional", price: "RM 249", desc: "Unlimited branches & staff", popular: true }
                  ]
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={[
                      "relative rounded-lg border p-3 text-left transition-all",
                      plan === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted hover:border-border/80"
                    ].join(" ")}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Popular
                      </span>
                    )}
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-base font-bold text-primary">{p.price}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}/mo</div>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleResubscribe} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Stripe…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Resubscribe &amp; restore access
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

        {/* Data safety note */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Your shop data, staff records, and transaction history are retained for <span className="text-foreground font-medium">90 days</span> after cancellation.
        </p>
      </div>
    </main>
  );
}
