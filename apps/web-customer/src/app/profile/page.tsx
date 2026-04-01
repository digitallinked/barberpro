import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileContent } from "./profile-content";

type CustomerAccount = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;
  subscription_status: string | null;
  subscription_plan: string | null;
};

type Appointment = {
  id: string;
  start_at: string;
  status: string;
  services: { name: string; price: number } | null;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
};

type QueueTicket = {
  id: string;
  queue_number: number;
  status: string;
  created_at: string;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: customer } = await (supabase as any)
    .from("customer_accounts")
    .select("id, full_name, email, phone, loyalty_points, subscription_status, subscription_plan")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: CustomerAccount | null };

  const subStatus = customer?.subscription_status ?? null;
  const membershipActive = subStatus === "active" || subStatus === "trialing";

  const userEmail = customer?.email || user.email || "";
  const { data: crmCustomers } = await admin
    .from("customers")
    .select("id, tenant_id")
    .eq("phone", userEmail);

  const crmIds = (crmCustomers ?? []).map((c) => c.id);

  let appointments: Appointment[] = [];
  if (crmIds.length > 0) {
    const { data } = await admin
      .from("appointments")
      .select("id, start_at, status, services(name, price), branches(name, tenants(name, slug))")
      .in("customer_id", crmIds)
      .order("start_at", { ascending: false })
      .limit(20) as { data: Appointment[] | null };
    appointments = data ?? [];
  }

  const { data: queueTickets } = await admin
    .from("queue_tickets")
    .select("id, queue_number, status, created_at, branches(name, tenants(name, slug))")
    .eq("customer_phone", userEmail)
    .order("created_at", { ascending: false })
    .limit(10) as { data: QueueTicket[] | null };

  const activeTickets = (queueTickets ?? []).filter(
    (t) => t.status === "waiting" || t.status === "in_service"
  );

  const displayName =
    customer?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    "";

  const loyaltyPoints = customer?.loyalty_points ?? 0;
  const loyaltyTier =
    loyaltyPoints >= 5000 ? "Gold" : loyaltyPoints >= 2000 ? "Silver" : "Bronze";
  const loyaltyTierColor =
    loyaltyTier === "Gold"
      ? "text-primary"
      : loyaltyTier === "Silver"
      ? "text-slate-400"
      : "text-amber-700";
  const nextTierPoints =
    loyaltyTier === "Bronze" ? 2000 : loyaltyTier === "Silver" ? 5000 : null;
  const progressPct = nextTierPoints
    ? Math.min(100, Math.round((loyaltyPoints / nextTierPoints) * 100))
    : 100;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ProfileContent
        displayName={displayName}
        customerEmail={customer?.email || user.email || ""}
        customerPhone={customer?.phone ?? null}
        loyaltyPoints={loyaltyPoints}
        loyaltyTier={loyaltyTier as "Gold" | "Silver" | "Bronze"}
        loyaltyTierColor={loyaltyTierColor}
        nextTierPoints={nextTierPoints}
        progressPct={progressPct}
        membershipActive={membershipActive}
        subscriptionPlan={customer?.subscription_plan ?? null}
        appointments={appointments}
        queueTickets={queueTickets ?? []}
        activeTickets={activeTickets}
      />
      <Footer />
    </div>
  );
}
