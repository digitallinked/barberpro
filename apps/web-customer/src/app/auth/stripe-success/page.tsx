import { redirect } from "next/navigation";

import { finalizeCustomerPlusSubscription } from "@/actions/subscription";

type Props = {
  searchParams: Promise<{ session_id?: string; next?: string }>;
};

function safeInternalPath(next: string | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export default async function CustomerStripeSuccessPage({ searchParams }: Props) {
  const { session_id, next } = await searchParams;

  if (!session_id) {
    redirect("/subscription?error=missing_session");
  }

  const result = await finalizeCustomerPlusSubscription(session_id);

  if (result.error) {
    redirect(`/subscription?error=${encodeURIComponent(result.error)}`);
  }

  redirect(safeInternalPath(next, "/subscription"));
}
