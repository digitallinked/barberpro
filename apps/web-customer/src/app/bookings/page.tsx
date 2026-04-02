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

export type ShopForQueue = {
  id: string;
  name: string;
  slug: string;
  branches: { id: string; name: string; address: string | null }[];
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const admin = createAdminClient();

  // Use user email as the CRM phone identifier (email-as-phone convention for auth users)
  const userEmail = user.email ?? "";

  // Resolve CRM customer IDs: by email-as-phone (check-in + appointments) AND by customer_accounts link
  const [{ data: crmByEmail }, { data: crmByAccount }] = await Promise.all([
    admin.from("customers").select("id").eq("phone", userEmail),
    admin.from("customer_accounts" as any).select("customer_id").eq("auth_user_id", user.id),
  ]);

  const crmIds = Array.from(
    new Set([
      ...(crmByEmail ?? []).map((c: { id: string }) => c.id),
      ...(crmByAccount ?? [])
        .map((c: { customer_id: string | null }) => c.customer_id)
        .filter((id): id is string => !!id),
    ])
  );

  // Fetch appointments through customer_id
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

  // Fetch queue tickets through customer_id (fix: was incorrectly using customer_phone)
  let queueTickets: QueueTicket[] = [];
  if (crmIds.length > 0) {
    const { data } = await admin
      .from("queue_tickets")
      .select("id, queue_number, status, created_at, notes, branches(name, tenants(name, slug))")
      .in("customer_id", crmIds)
      .order("created_at", { ascending: false })
      .limit(50) as { data: QueueTicket[] | null };
    queueTickets = data ?? [];
  }

  // Load active shops for the inline "Join Queue" flow
  const { data: tenantsRaw } = await admin
    .from("tenants")
    .select("id, name, slug, branches(id, name, address, accepts_walkin_queue)")
    .eq("status", "active")
    .order("name", { ascending: true });

  type RawBranch = { id: string; name: string; address: string | null; accepts_walkin_queue: boolean };
  const shops: ShopForQueue[] = (tenantsRaw ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      branches: ((t.branches as RawBranch[] | null) ?? []).filter(
        (b) => b.id && b.accepts_walkin_queue
      ),
    }))
    .filter((t) => t.branches.length > 0);

  const upcomingCount = appointments.filter((a) =>
    ["confirmed", "pending", "in_progress"].includes(a.status)
  ).length;

  const activeQueueCount = queueTickets.filter((t) =>
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

          <BookingsTabs
            appointments={appointments}
            queueTickets={queueTickets}
            shops={shops}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
