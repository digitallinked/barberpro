import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookingsTabs } from "./bookings-tabs";
import { BookingsHeader } from "./bookings-header";

type Appointment = {
  id: string;
  start_at: string;
  status: string;
  notes: string | null;
  services: { name: string; price: number; duration_min: number } | null;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
  staff_profiles: { app_users: { full_name: string } | null } | null;
};

type QueueTicket = {
  id: string;
  queue_number: number | string;
  status: string;
  created_at: string;
  notes: string | null;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const admin = createAdminClient();

  const { data: customerAccount } = await (supabase as any)
    .from("customer_accounts")
    .select("email")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: { email: string } | null };

  const userEmail = customerAccount?.email || user.email || "";

  // Resolve all CRM customer IDs linked to this user's email across tenants
  const { data: crmCustomers } = await admin
    .from("customers")
    .select("id, tenant_id")
    .eq("phone", userEmail);

  const crmIds = (crmCustomers ?? []).map((c) => c.id);

  // Fetch all appointments
  let appointments: Appointment[] = [];
  if (crmIds.length > 0) {
    const { data } = await admin
      .from("appointments")
      .select(
        "id, start_at, status, notes, services(name, price, duration_min), branches(name, tenants(name, slug)), staff_profiles:barber_staff_id(app_users(full_name))"
      )
      .in("customer_id", crmIds)
      .order("start_at", { ascending: false })
      .limit(50) as { data: Appointment[] | null };
    appointments = data ?? [];
  }

  // Fetch all queue tickets for this user
  const { data: queueTickets } = await admin
    .from("queue_tickets")
    .select(
      "id, queue_number, status, created_at, notes, branches(name, tenants(name, slug))"
    )
    .eq("customer_phone", userEmail)
    .order("created_at", { ascending: false })
    .limit(50) as { data: QueueTicket[] | null };

  const upcomingCount = appointments.filter((a) =>
    ["confirmed", "pending", "in_progress"].includes(a.status)
  ).length;

  const activeQueueCount = (queueTickets ?? []).filter((t) =>
    ["waiting", "in_service"].includes(t.status)
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <BookingsHeader
            upcomingCount={upcomingCount}
            activeQueueCount={activeQueueCount}
          />

          {/* Tabs */}
          <BookingsTabs
            appointments={appointments}
            queueTickets={queueTickets ?? []}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
