import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Star,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Scissors,
  Hash,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileEditForm } from "./profile-edit-form";
import { CancelAppointmentButton } from "./cancel-appointment-button";

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

const appointmentStatusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  confirmed: { label: "Confirmed", icon: CalendarCheck, color: "text-primary" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-muted-foreground" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-destructive" },
  no_show: { label: "No Show", icon: XCircle, color: "text-destructive" },
};

const queueStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  waiting: { label: "Waiting", color: "text-primary", bg: "bg-primary/10" },
  in_service: { label: "In Service", color: "text-primary", bg: "bg-primary/20" },
  completed: { label: "Done", color: "text-muted-foreground", bg: "bg-muted" },
  cancelled: { label: "Cancelled", color: "text-destructive", bg: "bg-destructive/10" },
  no_show: { label: "No Show", color: "text-destructive", bg: "bg-destructive/10" },
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

  // Get CRM customer IDs across all tenants for this user (linked via email)
  const userEmail = customer?.email || user.email || "";
  const { data: crmCustomers } = await admin
    .from("customers")
    .select("id, tenant_id")
    .eq("phone", userEmail);

  const crmIds = (crmCustomers ?? []).map((c) => c.id);

  // Fetch appointments
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

  // Fetch recent queue tickets (active + last 10)
  const { data: queueTickets } = await admin
    .from("queue_tickets")
    .select("id, queue_number, status, created_at, branches(name, tenants(name, slug))")
    .eq("customer_phone", userEmail)
    .order("created_at", { ascending: false })
    .limit(10) as { data: QueueTicket[] | null };

  const activeTickets = (queueTickets ?? []).filter(
    (t) => t.status === "waiting" || t.status === "in_service"
  );

  // Fall back to auth user metadata when customer_accounts row has no name yet
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

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">My Account</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {displayName.split(" ")[0] || "there"}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Loyalty Points</p>
              <p className="mt-1 text-2xl font-bold text-primary">{loyaltyPoints.toLocaleString()}</p>
              <p className={`text-xs font-medium ${loyaltyTierColor}`}>{loyaltyTier} Member</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Appointments</p>
              <p className="mt-1 text-2xl font-bold">{appointments.length}</p>
              <p className="text-xs text-muted-foreground">total booked</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-card p-4 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Active Queue</p>
              <p className="mt-1 text-2xl font-bold">{activeTickets.length}</p>
              <p className="text-xs text-muted-foreground">
                {activeTickets.length === 0 ? "no active tickets" : "ticket(s) live"}
              </p>
            </div>
          </div>

          <Link
            href="/subscription"
            className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">BarberPro Plus</p>
                <p className="text-sm text-muted-foreground">
                  {membershipActive
                    ? `Active${customer?.subscription_plan ? ` · ${customer.subscription_plan}` : ""}`
                    : "Member perks & priority features — tap to subscribe or manage"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-primary">Manage →</span>
            </div>
          </Link>

          {/* Active queue tickets */}
          {activeTickets.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Active Queue Tickets
              </h2>
              <div className="space-y-3">
                {activeTickets.map((ticket) => {
                  const tenantName = (ticket.branches?.tenants as { name: string; slug: string } | null)?.name;
                  const branchName = ticket.branches?.name;
                  const cfg = queueStatusConfig[ticket.status] ?? queueStatusConfig.waiting!;
                  return (
                    <Link
                      key={ticket.id}
                      href={`/queue/${ticket.id}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-lg font-bold text-primary">#{ticket.queue_number}</span>
                        </div>
                        <div>
                          <p className="font-medium">{tenantName ?? "Barbershop"}</p>
                          <p className="text-xs text-muted-foreground">{branchName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loyalty / Rewards */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Star className="h-4 w-4 text-primary" />
              Loyalty Rewards
            </h2>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{loyaltyPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
              <span className={`rounded-full border border-border px-3 py-1 text-sm font-semibold ${loyaltyTierColor}`}>
                {loyaltyTier}
              </span>
            </div>

            {nextTierPoints && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress to {loyaltyTier === "Bronze" ? "Silver" : "Gold"}</span>
                  <span>{loyaltyPoints.toLocaleString()} / {nextTierPoints.toLocaleString()} pts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {(nextTierPoints - loyaltyPoints).toLocaleString()} more points to{" "}
                  {loyaltyTier === "Bronze" ? "Silver" : "Gold"}
                </p>
              </div>
            )}

            {loyaltyTier === "Gold" && (
              <p className="mt-3 text-sm text-primary">
                You&apos;ve reached Gold status — maximum rewards unlocked!
              </p>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Earn points with every visit. Points are awarded automatically by your barbershop.
              </p>
            </div>
          </div>

          {/* Appointment History */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Appointment History
              </h2>
              <Link href="/shops" className="text-xs text-primary hover:underline">
                Book new →
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">No appointments yet.</p>
                <Link
                  href="/shops"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Find a barbershop <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map((appt) => {
                  const statusCfg = appointmentStatusConfig[appt.status] ?? appointmentStatusConfig.confirmed!;
                  const StatusIcon = statusCfg.icon;
                  const tenantName = (appt.branches?.tenants as { name: string; slug: string } | null)?.name;
                  const tenantSlug = (appt.branches?.tenants as { name: string; slug: string } | null)?.slug;
                  const branchName = appt.branches?.name;
                  const apptDate = new Date(appt.start_at);

                  return (
                    <div key={appt.id} className="flex items-center gap-4 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {appt.services?.name ?? "Service"}
                          {tenantName && (
                            <span className="ml-1.5 text-sm text-muted-foreground">
                              @ {tenantName}
                            </span>
                          )}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apptDate.toLocaleDateString("en-MY", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            {apptDate.toLocaleTimeString("en-MY", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {branchName && <span>{branchName}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {appt.services?.price !== undefined && (
                          <p className="text-sm font-semibold">
                            RM {Number(appt.services.price).toFixed(2)}
                          </p>
                        )}
                        <span className={`flex items-center justify-end gap-1 text-xs ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                        {appt.status === "confirmed" && (
                          <div className="mt-1.5">
                            <CancelAppointmentButton appointmentId={appt.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <User className="h-4 w-4 text-primary" />
              Account Details
            </h2>
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{customer?.email || user.email}</span>
            </div>
            <ProfileEditForm
              initialName={displayName}
              initialPhone={customer?.phone ?? ""}
            />
          </div>

          {/* Queue history */}
          {(queueTickets ?? []).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Hash className="h-4 w-4 text-primary" />
                Queue History
              </h2>
              <div className="divide-y divide-border">
                {(queueTickets ?? []).map((ticket) => {
                  const tenantName = (ticket.branches?.tenants as { name: string; slug: string } | null)?.name;
                  const branchName = ticket.branches?.name;
                  const cfg = queueStatusConfig[ticket.status] ?? queueStatusConfig.waiting!;
                  const isActive = ticket.status === "waiting" || ticket.status === "in_service";

                  return (
                    <div key={ticket.id} className="flex items-center gap-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                        #{ticket.queue_number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{tenantName ?? "Barbershop"}</p>
                        <p className="text-xs text-muted-foreground">{branchName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {isActive ? (
                          <Link
                            href={`/queue/${ticket.id}`}
                            className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            Track →
                          </Link>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/shops"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Scissors className="h-4 w-4" /> Find Shops
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
