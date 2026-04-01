"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Clock,
  Hash,
  ArrowRight,
  Scissors,
  Search,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  RadioTower,
  Timer,
} from "lucide-react";
import { cancelAppointmentAction } from "./actions";

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

type Props = {
  appointments: Appointment[];
  queueTickets: QueueTicket[];
};

const APPOINTMENT_STATUS: Record<
  string,
  { label: string; icon: React.ElementType; textCls: string; bgCls: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: CalendarCheck,
    textCls: "text-primary",
    bgCls: "bg-primary/10",
  },
  pending: {
    label: "Pending",
    icon: Timer,
    textCls: "text-amber-500",
    bgCls: "bg-amber-500/10",
  },
  in_progress: {
    label: "In Progress",
    icon: RadioTower,
    textCls: "text-blue-400",
    bgCls: "bg-blue-400/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    textCls: "text-muted-foreground",
    bgCls: "bg-muted",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    textCls: "text-destructive",
    bgCls: "bg-destructive/10",
  },
  no_show: {
    label: "No Show",
    icon: XCircle,
    textCls: "text-destructive",
    bgCls: "bg-destructive/10",
  },
};

const QUEUE_STATUS: Record<
  string,
  { label: string; textCls: string; bgCls: string }
> = {
  waiting: {
    label: "Waiting",
    textCls: "text-primary",
    bgCls: "bg-primary/10",
  },
  in_service: {
    label: "In Service",
    textCls: "text-blue-400",
    bgCls: "bg-blue-400/10",
  },
  done: {
    label: "Done",
    textCls: "text-muted-foreground",
    bgCls: "bg-muted",
  },
  completed: {
    label: "Done",
    textCls: "text-muted-foreground",
    bgCls: "bg-muted",
  },
  paid: {
    label: "Paid",
    textCls: "text-muted-foreground",
    bgCls: "bg-muted",
  },
  cancelled: {
    label: "Cancelled",
    textCls: "text-destructive",
    bgCls: "bg-destructive/10",
  },
  no_show: {
    label: "No Show",
    textCls: "text-destructive",
    bgCls: "bg-destructive/10",
  },
};

function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  if (cancelled) return null;

  function handleCancel() {
    if (!confirm("Cancel this appointment?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId);
      if (result.success) {
        setCancelled(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Cancel
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const cfg =
    APPOINTMENT_STATUS[appt.status] ?? APPOINTMENT_STATUS.confirmed!;
  const StatusIcon = cfg.icon;
  const tenantName =
    (appt.branches?.tenants as { name: string; slug: string } | null)?.name;
  const tenantSlug =
    (appt.branches?.tenants as { name: string; slug: string } | null)?.slug;
  const branchName = appt.branches?.name;
  const barberName =
    (appt.staff_profiles?.app_users as { full_name: string } | null)
      ?.full_name;
  const apptDate = new Date(appt.start_at);

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Scissors className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {appt.services?.name ?? "Service"}
            </p>
            {tenantSlug ? (
              <Link
                href={`/shop/${tenantSlug}`}
                className="truncate text-sm text-muted-foreground hover:text-primary"
              >
                {tenantName}
                {branchName ? ` · ${branchName}` : ""}
              </Link>
            ) : (
              <p className="truncate text-sm text-muted-foreground">
                {tenantName}
                {branchName ? ` · ${branchName}` : ""}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            {appt.services?.price !== undefined && (
              <p className="text-sm font-semibold">
                RM {Number(appt.services.price).toFixed(2)}
              </p>
            )}
            <span
              className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgCls} ${cfg.textCls}`}
            >
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {apptDate.toLocaleDateString("en-MY", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            {apptDate.toLocaleTimeString("en-MY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {appt.services?.duration_min && (
            <span>{appt.services.duration_min} min</span>
          )}
          {barberName && <span>with {barberName}</span>}
        </div>

        {appt.notes && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            &ldquo;{appt.notes}&rdquo;
          </p>
        )}

        {appt.status === "confirmed" && (
          <div className="mt-2 flex items-center gap-3">
            {tenantSlug && (
              <Link
                href={`/shop/${tenantSlug}/book`}
                className="text-xs text-primary hover:underline"
              >
                Book again →
              </Link>
            )}
            <CancelButton appointmentId={appt.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({ ticket }: { ticket: QueueTicket }) {
  const cfg = QUEUE_STATUS[ticket.status] ?? QUEUE_STATUS.waiting!;
  const tenantName =
    (ticket.branches?.tenants as { name: string; slug: string } | null)?.name;
  const branchName = ticket.branches?.name;
  const isActive =
    ticket.status === "waiting" || ticket.status === "in_service";
  const ticketDate = new Date(ticket.created_at);

  return (
    <div className="flex items-center gap-4 py-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <span className="text-sm">#{ticket.queue_number}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tenantName ?? "Barbershop"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {branchName}
          {" · "}
          {ticketDate.toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>

      <div className="shrink-0">
        {isActive ? (
          <Link
            href={`/queue/${ticket.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
          >
            Track <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bgCls} ${cfg.textCls}`}
          >
            {cfg.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function BookingsTabs({ appointments, queueTickets }: Props) {
  const [activeTab, setActiveTab] = useState<"appointments" | "queue">(
    "appointments"
  );

  const upcomingAppts = appointments.filter((a) =>
    ["confirmed", "pending", "in_progress"].includes(a.status)
  );
  const pastAppts = appointments.filter((a) =>
    ["completed", "cancelled", "no_show"].includes(a.status)
  );

  const activeTickets = queueTickets.filter((t) =>
    ["waiting", "in_service"].includes(t.status)
  );
  const pastTickets = queueTickets.filter(
    (t) => !["waiting", "in_service"].includes(t.status)
  );

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab("appointments")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "appointments"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          Appointments
          {upcomingAppts.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "appointments"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {upcomingAppts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "queue"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Hash className="h-4 w-4" />
          Queue
          {activeTickets.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "queue"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {activeTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* Appointments panel */}
      {activeTab === "appointments" && (
        <div className="mt-4 space-y-4">
          {/* Active queue alert when on appointments tab */}
          {activeTickets.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                You have {activeTickets.length} active queue ticket
                {activeTickets.length > 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="text-xs text-primary hover:underline"
              >
                View queue →
              </button>
            </div>
          )}

          {/* Upcoming */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Upcoming
              </h2>
              <Link
                href="/shops"
                className="text-xs text-primary hover:underline"
              >
                + New booking
              </Link>
            </div>

            {upcomingAppts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
                <Link
                  href="/shops"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Search className="h-3.5 w-3.5" /> Find a barbershop
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border px-5">
                {upcomingAppts.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {pastAppts.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 px-5 pt-5 pb-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <CalendarX className="h-4 w-4 text-muted-foreground" />
                  History
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {pastAppts.length}
                </span>
              </div>
              <div className="divide-y divide-border px-5">
                {pastAppts.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <Scissors className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 font-medium">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Find a barbershop and book your first appointment
              </p>
              <Link
                href="/shops"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Search className="h-4 w-4" /> Find Shops
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Queue panel */}
      {activeTab === "queue" && (
        <div className="mt-4 space-y-4">
          {/* Active tickets */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 pt-5 pb-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <RadioTower className="h-4 w-4 text-primary" />
                Active
              </h2>
              {activeTickets.length > 0 && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              )}
            </div>

            {activeTickets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Hash className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No active queue tickets
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visit a barbershop to join the queue, or use check-in kiosks on site
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border px-5">
                {activeTickets.map((ticket) => (
                  <QueueCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>

          {/* Queue history */}
          {pastTickets.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 px-5 pt-5 pb-2">
                <h2 className="flex items-center gap-2 font-semibold text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Past Visits
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {pastTickets.length}
                </span>
              </div>
              <div className="divide-y divide-border px-5 pb-2">
                {pastTickets.map((ticket) => (
                  <QueueCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {queueTickets.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <Hash className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 font-medium">No queue history</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your queue tickets will appear here after visiting a barbershop
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
