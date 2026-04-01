import { redirect } from "next/navigation";

import { finalizeSubscription } from "@/actions/stripe";

type StripeSuccessPageProps = {
  searchParams: Promise<{ session_id?: string; next?: string }>;
};

function safeInternalPath(next: string | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export default async function StripeSuccessPage({ searchParams }: StripeSuccessPageProps) {
  const { session_id, next } = await searchParams;

  if (!session_id) {
    redirect("/register?step=payment&error=missing_session");
  }

  const result = await finalizeSubscription(session_id);

  if (result.error) {
    const billingNext = safeInternalPath(next, "/dashboard");
    if (billingNext.startsWith("/settings/billing")) {
      redirect(`/settings/billing?checkout=error&message=${encodeURIComponent(result.error)}`);
    }
    redirect(`/register?step=payment&error=${encodeURIComponent(result.error)}`);
  }

  redirect(safeInternalPath(next, "/dashboard"));
}
