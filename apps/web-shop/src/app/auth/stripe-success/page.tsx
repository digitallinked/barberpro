import { redirect } from "next/navigation";

import { finalizeSubscription } from "@/actions/stripe";

type StripeSuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function StripeSuccessPage({ searchParams }: StripeSuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/register?step=payment&error=missing_session");
  }

  const result = await finalizeSubscription(session_id);

  if (result.error) {
    redirect(`/register?step=payment&error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard");
}
