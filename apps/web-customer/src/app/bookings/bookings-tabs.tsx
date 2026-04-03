"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Clock,
  Scissors,
  Search,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  RadioTower,
  Timer,
  Plus,
} from "lucide-react";
import { cancelAppointmentAction } from "./actions";
import { useT } from "@/lib/i18n/language-context";

type Appointment = {
  id: string;
  start_at: string;
  status: string;
  notes: string | null;
  services: { name: string; price: number; duration_min: number } | null;
  branches: { name: string; tenants: { name: string; slug: string } | null } | null;
  staff_profiles: { app_users: { full_name: string } | null } | null;
};

type Props = {
  appointments: Appointment[];
};

// ─── Cancel Appointment Button ────────────────────────────────────────────────

function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const t = useT();

  if (cancelled) return null;

  function handleCancel() {
    if (!confirm(t.bookings.cancelAppt + "?")) return;
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
        {t.bookings.cancelAppt}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({ appt }: { appt: Appointment }) {
  const t = useT();

  const APPOINTMENT_STATUS: Record<
    string,
    { label: string; icon: React.ElementType; textCls: string; bgCls: string }
  > = {
    confirmed: { label: "Confirmed", icon: CalendarCheck, textCls: "text-primary", bgCls: "bg-primary/10" },
    pending: { label: "Pending", icon: Timer, textCls: "text-amber-500", bgCls: "bg-amber-500/10" },
    in_progress: { label: "In Progress", icon: RadioTower, textCls: "text-blue-400", bgCls: "bg-blue-400/10" },
    completed: { label: t.profile.statusCompleted, icon: CheckCircle2, textCls: "text-muted-foreground", bgCls: "bg-muted" },
    cancelled: { label: t.profile.statusCancelled, icon: XCircle, textCls: "text-destructive", bgCls: "bg-destructive/10" },
    no_show: { label: t.profile.statusNoShow, icon: XCircle, textCls: "text-destructive", bgCls: "bg-destructive/10" },
  };

  const cfg = APPOINTMENT_STATUS[appt.status] ?? APPOINTMENT_STATUS.confirmed!;
  const StatusIcon = cfg.icon;
  const tenantName = (appt.branches?.tenants as { name: string; slug: string } | null)?.name;
  const tenantSlug = (appt.branches?.tenants as { name: string; slug: string } | null)?.slug;
  const branchName = appt.branches?.name;
  const barberName = (appt.staff_profiles?.app_users as { full_name: string } | null)?.full_name;
  const apptDate = new Date(appt.start_at);
  const canCancel = appt.status === "confirmed";
  const isPast = ["completed", "cancelled", "no_show"].includes(appt.status);

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Scissors className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{appt.services?.name ?? t.bookings.service}</p>
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
              <p className="text-sm font-semibold">RM {Number(appt.services.price).toFixed(2)}</p>
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
            {apptDate.toLocaleDateString("ms-MY", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            {apptDate.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {appt.services?.duration_min && <span>{appt.services.duration_min} min</span>}
          {barberName && <span>{t.bookings.with} {barberName}</span>}
        </div>

        {appt.notes && (
          <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{appt.notes}&rdquo;</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {tenantSlug && (isPast || canCancel) && (
            <Link href={`/shop/${tenantSlug}/book`} className="text-xs text-primary hover:underline">
              {t.bookings.bookAgain}
            </Link>
          )}
          {canCancel && <CancelButton appointmentId={appt.id} />}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BookingsTabs({ appointments }: Props) {
  const t = useT();

  const upcomingAppts = appointments.filter((a) =>
    ["confirmed", "pending", "in_progress"].includes(a.status)
  );
  const pastAppts = appointments.filter((a) =>
    ["completed", "cancelled", "no_show"].includes(a.status)
  );

  return (
    <div className="space-y-4">
      {/* Upcoming */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarCheck className="h-4 w-4 text-primary" />
            {t.bookings.upcoming}
          </h2>
          <Link
            href="/shops"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.bookings.newBooking}
          </Link>
        </div>

        {upcomingAppts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">{t.bookings.noUpcoming}</p>
            <Link
              href="/shops"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Search className="h-3.5 w-3.5" /> {t.bookings.findBarbershop}
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

      {/* Past */}
      {pastAppts.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 px-5 pt-5 pb-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarX className="h-4 w-4 text-muted-foreground" />
              {t.bookings.history}
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

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <Scissors className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-medium">{t.bookings.noBookingsYet}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.bookings.noBookingsDesc}</p>
          <Link
            href="/shops"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Search className="h-4 w-4" /> {t.bookings.findShops}
          </Link>
        </div>
      )}
    </div>
  );
}
