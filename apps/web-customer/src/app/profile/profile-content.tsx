"use client";

import Link from "next/link";
import {
  User,
  Star,
  CalendarCheck,
  Clock,
  ArrowRight,
  Scissors,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { useT } from "@/lib/i18n/language-context";
import { ProfileEditForm } from "./profile-edit-form";
import { CancelAppointmentButton } from "./cancel-appointment-button";

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

type Props = {
  displayName: string;
  customerEmail: string;
  customerPhone: string | null;
  loyaltyPoints: number;
  loyaltyTier: "Gold" | "Silver" | "Bronze";
  loyaltyTierColor: string;
  nextTierPoints: number | null;
  progressPct: number;
  membershipActive: boolean;
  subscriptionPlan: string | null;
  appointments: Appointment[];
  queueTickets: QueueTicket[];
  activeTickets: QueueTicket[];
};

export function ProfileContent({
  displayName,
  customerEmail,
  customerPhone,
  loyaltyPoints,
  loyaltyTier,
  loyaltyTierColor,
  nextTierPoints,
  progressPct,
  membershipActive,
  subscriptionPlan,
  appointments,
  queueTickets,
  activeTickets,
}: Props) {
  const t = useT();

  const tierLabel =
    loyaltyTier === "Gold"
      ? t.profile.tierGold
      : loyaltyTier === "Silver"
      ? t.profile.tierSilver
      : t.profile.tierBronze;

  const nextTierLabel =
    loyaltyTier === "Bronze" ? t.profile.tierSilver : t.profile.tierGold;

  const appointmentStatusConfig: Record<
    string,
    { label: string; icon: React.ElementType; color: string }
  > = {
    confirmed: { label: t.profile.statusConfirmed, icon: CalendarCheck, color: "text-primary" },
    completed: { label: t.profile.statusCompleted, icon: CheckCircle2, color: "text-muted-foreground" },
    cancelled: { label: t.profile.statusCancelled, icon: XCircle, color: "text-destructive" },
    no_show: { label: t.profile.statusNoShow, icon: XCircle, color: "text-destructive" },
  };

  const queueStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    waiting: { label: t.profile.statusWaiting, color: "text-primary", bg: "bg-primary/10" },
    in_service: { label: t.profile.statusInService, color: "text-primary", bg: "bg-primary/20" },
    completed: { label: t.profile.statusDone, color: "text-muted-foreground", bg: "bg-muted" },
    cancelled: { label: t.profile.statusCancelled, color: "text-destructive", bg: "bg-destructive/10" },
    no_show: { label: t.profile.statusNoShow, color: "text-destructive", bg: "bg-destructive/10" },
  };

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.profile.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.profile.welcomeBack} {displayName.split(" ")[0] || ""}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t.profile.loyaltyPoints}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{loyaltyPoints.toLocaleString()}</p>
            <p className={`text-xs font-medium ${loyaltyTierColor}`}>
              {tierLabel} {t.profile.tierMember}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t.profile.appointments}</p>
            <p className="mt-1 text-2xl font-bold">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">{t.profile.totalBooked}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-card p-4 sm:col-span-1">
            <p className="text-xs text-muted-foreground">{t.profile.activeQueue}</p>
            <p className="mt-1 text-2xl font-bold">{activeTickets.length}</p>
            <p className="text-xs text-muted-foreground">
              {activeTickets.length === 0 ? t.profile.noActiveTickets : t.profile.ticketsLive}
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
                  ? `${t.profile.membershipActive}${subscriptionPlan ? ` · ${subscriptionPlan}` : ""}`
                  : t.profile.membershipInactive}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium text-primary">{t.profile.manage}</span>
          </div>
        </Link>

        {/* Active queue tickets */}
        {activeTickets.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {t.profile.activeQueueTickets}
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
                        <p className="font-medium">{tenantName ?? t.profile.barbershop}</p>
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
            {t.profile.loyaltyRewards}
          </h2>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">{loyaltyPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{t.profile.points}</p>
            </div>
            <span className={`rounded-full border border-border px-3 py-1 text-sm font-semibold ${loyaltyTierColor}`}>
              {tierLabel}
            </span>
          </div>

          {nextTierPoints && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{t.profile.progressTo} {nextTierLabel}</span>
                <span>{loyaltyPoints.toLocaleString()} / {nextTierPoints.toLocaleString()} pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {(nextTierPoints - loyaltyPoints).toLocaleString()} {t.profile.morePointsTo} {nextTierLabel}
              </p>
            </div>
          )}

          {loyaltyTier === "Gold" && (
            <p className="mt-3 text-sm text-primary">{t.profile.goldStatus}</p>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">{t.profile.earnPoints}</p>
          </div>
        </div>

        {/* Appointment History */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarCheck className="h-4 w-4 text-primary" />
              {t.profile.appointmentHistory}
            </h2>
            <Link href="/shops" className="text-xs text-primary hover:underline">
              {t.profile.bookNew}
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">{t.profile.noAppointments}</p>
              <Link
                href="/shops"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                {t.profile.findBarbershop} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {appointments.map((appt) => {
                const statusCfg = appointmentStatusConfig[appt.status] ?? appointmentStatusConfig.confirmed!;
                const StatusIcon = statusCfg.icon;
                const tenantName = (appt.branches?.tenants as { name: string; slug: string } | null)?.name;
                const branchName = appt.branches?.name;
                const apptDate = new Date(appt.start_at);

                return (
                  <div key={appt.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {appt.services?.name ?? t.bookings.service}
                        {tenantName && (
                          <span className="ml-1.5 text-sm text-muted-foreground">
                            @ {tenantName}
                          </span>
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apptDate.toLocaleDateString("ms-MY", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          {apptDate.toLocaleTimeString("ms-MY", {
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
            {t.profile.accountDetails}
          </h2>
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-muted-foreground">{t.profile.email}</span>
            <span className="font-medium">{customerEmail}</span>
          </div>
          <ProfileEditForm
            initialName={displayName}
            initialPhone={customerPhone ?? ""}
          />
        </div>

        {/* Queue history */}
        {queueTickets.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Hash className="h-4 w-4 text-primary" />
              {t.profile.queueHistory}
            </h2>
            <div className="divide-y divide-border">
              {queueTickets.map((ticket) => {
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
                      <p className="truncate text-sm font-medium">{tenantName ?? t.profile.barbershop}</p>
                      <p className="text-xs text-muted-foreground">{branchName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {isActive ? (
                        <Link
                          href={`/queue/${ticket.id}`}
                          className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          {t.profile.track}
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
            <Scissors className="h-4 w-4" /> {t.profile.findShops}
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              {t.profile.signOut}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
