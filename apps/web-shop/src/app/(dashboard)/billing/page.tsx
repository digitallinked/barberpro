import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BillingSettingsClient } from "@/app/(dashboard)/billing/billing-settings-client";
import { loadShopBillingSnapshot } from "@/lib/billing-snapshot";
import { hasStripeEnv } from "@/lib/env";

export default async function BillingPage() {
  const snapshot = await loadShopBillingSnapshot();

  if (!snapshot) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-400">Sign in as a shop owner to manage billing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/settings"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3 w-3" /> Back to settings
          </Link>
          <h2 className="text-xl font-bold text-white">Subscription &amp; billing</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage your BarberPro plan, payment method, invoices, and cancellation in Stripe.
          </p>
        </div>
      </div>

      <BillingSettingsClient
        snapshot={snapshot}
        stripeConfigured={hasStripeEnv()}
      />
    </div>
  );
}
