"use client";

import { useState, useTransition, useRef, useEffect } from "react";
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
  Plus,
  MapPin,
  ChevronDown,
  ChevronUp,
  Users,
  ExternalLink,
} from "lucide-react";
import { cancelAppointmentAction, joinQueueAsCustomerAction } from "./actions";
import { useT } from "@/lib/i18n/language-context";
import type { ShopForQueue } from "./page";

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
  shops: ShopForQueue[];
};

// ─── Cancel Appointment Button ──────────────────────────────────────────────

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

// ─── Appointment Card ────────────────────────────────────────────────────────

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
            <p className="truncate font-medium">
              {appt.services?.name ?? t.bookings.service}
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
            {apptDate.toLocaleDateString("ms-MY", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            {apptDate.toLocaleTimeString("ms-MY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {appt.services?.duration_min && (
            <span>{appt.services.duration_min} min</span>
          )}
          {barberName && <span>{t.bookings.with} {barberName}</span>}
        </div>

        {appt.notes && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            &ldquo;{appt.notes}&rdquo;
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {tenantSlug && (isPast || canCancel) && (
            <Link
              href={`/shop/${tenantSlug}/book`}
              className="text-xs text-primary hover:underline"
            >
              {t.bookings.bookAgain}
            </Link>
          )}
          {canCancel && <CancelButton appointmentId={appt.id} />}
        </div>
      </div>
    </div>
  );
}

// ─── Queue Ticket Card ───────────────────────────────────────────────────────

function QueueCard({ ticket }: { ticket: QueueTicket }) {
  const t = useT();

  const QUEUE_STATUS: Record<string, { label: string; textCls: string; bgCls: string }> = {
    waiting: { label: t.profile.statusWaiting, textCls: "text-primary", bgCls: "bg-primary/10" },
    in_service: { label: t.profile.statusInService, textCls: "text-blue-400", bgCls: "bg-blue-400/10" },
    done: { label: t.profile.statusDone, textCls: "text-muted-foreground", bgCls: "bg-muted" },
    completed: { label: t.profile.statusDone, textCls: "text-muted-foreground", bgCls: "bg-muted" },
    paid: { label: t.profile.statusDone, textCls: "text-muted-foreground", bgCls: "bg-muted" },
    cancelled: { label: t.profile.statusCancelled, textCls: "text-destructive", bgCls: "bg-destructive/10" },
    no_show: { label: t.profile.statusNoShow, textCls: "text-destructive", bgCls: "bg-destructive/10" },
  };

  const cfg = QUEUE_STATUS[ticket.status] ?? QUEUE_STATUS.waiting!;
  const tenantName = (ticket.branches?.tenants as { name: string; slug: string } | null)?.name;
  const branchName = ticket.branches?.name;
  const isActive = ticket.status === "waiting" || ticket.status === "in_service";
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
        <p className="truncate font-medium">{tenantName ?? t.profile.barbershop}</p>
        <p className="truncate text-xs text-muted-foreground">
          {branchName}
          {" · "}
          {ticketDate.toLocaleDateString("ms-MY", {
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
            {t.profile.track} <ArrowRight className="h-3 w-3" />
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

// ─── Join Queue Panel ────────────────────────────────────────────────────────

type JoinStep = "search" | "branch" | "confirm" | "done";

type JoinDone = {
  ticketId: string;
  queueNumber: string;
  branchName: string;
};

function JoinQueuePanel({
  shops,
  onClose,
  onJoined,
}: {
  shops: ShopForQueue[];
  onClose: () => void;
  onJoined: (done: JoinDone) => void;
}) {
  const [step, setStep] = useState<JoinStep>("search");
  const [query, setQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<ShopForQueue | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "search") searchRef.current?.focus();
  }, [step]);

  const filtered = query.trim()
    ? shops.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.branches.some(
            (b) =>
              b.name.toLowerCase().includes(q) ||
              (b.address ?? "").toLowerCase().includes(q)
          )
        );
      })
    : shops;

  function pickShop(shop: ShopForQueue) {
    setSelectedShop(shop);
    if (shop.branches.length === 1) {
      setSelectedBranchId(shop.branches[0]!.id);
      setStep("confirm");
    } else {
      setSelectedBranchId(shop.branches[0]?.id ?? "");
      setStep("branch");
    }
  }

  function handleJoin() {
    if (!selectedBranchId) return;
    setError(null);
    startTransition(async () => {
      const result = await joinQueueAsCustomerAction(selectedBranchId, partySize);
      if (result.success) {
        onJoined({
          ticketId: result.ticketId,
          queueNumber: result.queueNumber,
          branchName: result.branchName,
        });
      } else {
        setError(result.error);
      }
    });
  }

  const selectedBranch = selectedShop?.branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="rounded-xl border border-primary/30 bg-card shadow-lg">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {step !== "search" && (
            <button
              onClick={() => setStep(step === "confirm" && selectedShop && selectedShop.branches.length > 1 ? "branch" : "search")}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
          )}
          <Hash className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Join a Walk-in Queue</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        {/* Step 1: Search for shop */}
        {step === "search" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by shop name or area…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {query ? `No shops found for "${query}"` : "No shops available"}
                </p>
              ) : (
                filtered.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => pickShop(shop)}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{shop.name}</p>
                      {shop.branches[0]?.address && (
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {shop.branches[0].address}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select branch (if multiple) */}
        {step === "branch" && selectedShop && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Choose a branch at {selectedShop.name}
              </p>
              <div className="space-y-2">
                {selectedShop.branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                      setStep("confirm");
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      selectedBranchId === branch.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{branch.name}</p>
                      {branch.address && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{branch.address}</p>
                      )}
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm — party size + submit */}
        {step === "confirm" && selectedShop && selectedBranch && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <Scissors className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{selectedShop.name}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedBranch.name}</p>
              </div>
            </div>

            {/* Party size */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Users className="h-3.5 w-3.5 text-primary" />
                How many people?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={partySize <= 1}
                  onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center text-xl font-bold tabular-nums">
                  {partySize}
                </span>
                <button
                  type="button"
                  disabled={partySize >= 20}
                  onClick={() => setPartySize((p) => Math.min(20, p + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  {partySize === 1 ? "person" : "people"}
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Hash className="h-4 w-4" /> Join Queue
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Join Queue Success Banner ───────────────────────────────────────────────

function JoinSuccessBanner({ done, onDismiss }: { done: JoinDone; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <span className="text-lg font-black text-primary">#{done.queueNumber}</span>
          </div>
          <div>
            <p className="font-semibold text-primary">You&apos;re in the queue!</p>
            <p className="text-sm text-muted-foreground">{done.branchName}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="mt-0.5 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Link
        href={`/queue/${done.ticketId}`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Track my position <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─── Main Tabs Component ─────────────────────────────────────────────────────

export function BookingsTabs({ appointments, queueTickets, shops }: Props) {
  const [activeTab, setActiveTab] = useState<"appointments" | "queue">("appointments");
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [joinDone, setJoinDone] = useState<JoinDone | null>(null);
  const t = useT();

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

  function handleJoined(done: JoinDone) {
    setJoinDone(done);
    setShowJoinPanel(false);
  }

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
          {t.bookings.tabAppointments}
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
          {t.bookings.tabQueue}
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

      {/* ── Appointments Panel ── */}
      {activeTab === "appointments" && (
        <div className="mt-4 space-y-4">
          {/* Active queue alert */}
          {activeTickets.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {t.bookings.activeTicketsAlert.replace("{count}", String(activeTickets.length))}
                {activeTickets.length > 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="text-xs text-primary hover:underline"
              >
                {t.bookings.viewQueue}
              </button>
            </div>
          )}

          {/* Upcoming appointments */}
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
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.bookings.noUpcoming}
                </p>
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

          {/* Past appointments */}
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

          {appointments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <Scissors className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 font-medium">{t.bookings.noBookingsYet}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.bookings.noBookingsDesc}
              </p>
              <Link
                href="/shops"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Search className="h-4 w-4" /> {t.bookings.findShops}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Queue Panel ── */}
      {activeTab === "queue" && (
        <div className="mt-4 space-y-4">
          {/* Join success */}
          {joinDone && (
            <JoinSuccessBanner done={joinDone} onDismiss={() => setJoinDone(null)} />
          )}

          {/* Join queue panel */}
          {showJoinPanel && (
            <JoinQueuePanel
              shops={shops}
              onClose={() => setShowJoinPanel(false)}
              onJoined={handleJoined}
            />
          )}

          {/* Active tickets */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <RadioTower className="h-4 w-4 text-primary" />
                {t.bookings.active}
                {activeTickets.length > 0 && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                )}
              </h2>
              {!showJoinPanel && (
                <button
                  type="button"
                  onClick={() => setShowJoinPanel(true)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Join a queue
                </button>
              )}
            </div>

            {activeTickets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Hash className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.bookings.noActiveQueue}
                </p>
                {!showJoinPanel && (
                  <button
                    type="button"
                    onClick={() => setShowJoinPanel(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    <Hash className="h-3.5 w-3.5" /> Find & join a walk-in queue
                  </button>
                )}
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
                  {t.bookings.pastVisits}
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

          {queueTickets.length === 0 && !showJoinPanel && (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <Hash className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 font-medium">{t.bookings.noQueueHistory}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.bookings.noQueueHistoryDesc}
              </p>
              <button
                type="button"
                onClick={() => setShowJoinPanel(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Hash className="h-4 w-4" /> Find & join a queue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
