"use client";

import { AlertTriangle, CreditCard, X, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  trialEndsAt: string;
  stripeSubscriptionId: string | null;
};

function daysLeft(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function TrialBanner({ trialEndsAt, stripeSubscriptionId }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Only show the banner for DB-only trials (no Stripe subscription yet)
  if (stripeSubscriptionId) return null;
  if (dismissed) return null;

  const days = daysLeft(trialEndsAt);
  if (days <= 0) return null;

  const isUrgent = days <= 3;
  const isWarning = days <= 7;

  const bgClass = isUrgent
    ? "bg-red-500/10 border-red-500/30 text-red-400"
    : isWarning
      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
      : "bg-primary/10 border-primary/30 text-primary";

  const iconClass = isUrgent ? "text-red-400" : isWarning ? "text-amber-400" : "text-primary";

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2.5 text-sm ${bgClass}`}>
      {isUrgent ? (
        <AlertTriangle className={`h-4 w-4 shrink-0 ${iconClass}`} />
      ) : (
        <Zap className={`h-4 w-4 shrink-0 ${iconClass}`} />
      )}
      <span className="flex-1">
        {isUrgent ? (
          <>
            <span className="font-semibold">Trial ends in {days} day{days !== 1 ? "s" : ""}!</span>
            {" "}Subscribe now to keep your shop active.
          </>
        ) : isWarning ? (
          <>
            Your 14-day free trial ends in <span className="font-semibold">{days} days</span>.
            {" "}Subscribe to continue without interruption.
          </>
        ) : (
          <>
            You have <span className="font-semibold">{days} days</span> left in your free trial.
          </>
        )}
      </span>
      <Link
        href="/settings/billing"
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold transition-colors hover:opacity-80 ${bgClass}`}
      >
        <CreditCard className="h-3 w-3" />
        Subscribe now
      </Link>
      {!isUrgent && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`shrink-0 ${iconClass} hover:opacity-70`}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
