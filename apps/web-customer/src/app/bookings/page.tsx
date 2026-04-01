import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookingsTabs } from "./bookings-tabs";

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
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <CalendarClock className="h-6 w-6 text-primary" />
                My Bookings
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your appointments and queue tickets
              </p>
            </div>
            <Link
              href="/shops"
              className="flex items-center gap-1.5 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              Find Shops
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {upcomingCount}
              </p>
              <p className="text-xs text-muted-foreground">appointment{upcomingCount !== 1 ? "s" : ""}</p>
            </div>
            <div
              className={`rounded-xl border bg-card p-4 ${
                activeQueueCount > 0
                  ? "border-primary/30 bg-primary/5"
                  : "border-border"
              }`}
            >
              <p className="text-xs text-muted-foreground">Active Queue</p>
              <div className="mt-1 flex items-center gap-2">
                <p
                  className={`text-2xl font-bold ${
                    activeQueueCount > 0 ? "text-primary" : ""
                  }`}
                >
                  {activeQueueCount}
                </p>
                {activeQueueCount > 0 && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                ticket{activeQueueCount !== 1 ? "s" : ""} live
              </p>
            </div>
          </div>

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
