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

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const admin = createAdminClient();
  const userEmail = user.email ?? "";

  // Resolve CRM customer IDs
  const [{ data: crmByEmail }, { data: crmByAccountRaw }] = await Promise.all([
    admin.from("customers").select("id").eq("phone", userEmail),
    (admin as any).from("customer_accounts").select("customer_id").eq("auth_user_id", user.id),
  ]);

  const crmByAccount = crmByAccountRaw as Array<{ customer_id: string | null }> | null;
  const crmIds = Array.from(
    new Set([
      ...(crmByEmail ?? []).map((c: { id: string }) => c.id),
      ...(crmByAccount ?? [])
        .map((c) => c.customer_id)
        .filter((id): id is string => !!id),
    ])
  );

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

  const upcomingCount = appointments.filter((a) =>
    ["confirmed", "pending", "in_progress"].includes(a.status)
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 pb-24 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <BookingsHeader upcomingCount={upcomingCount} />
          <BookingsTabs appointments={appointments} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
