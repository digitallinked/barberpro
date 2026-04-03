"use client";

import { Clock, Scissors, Star, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { getQueueColor, queueBoardFontClass as qFont } from "@barberpro/types";

import { useQueueBoard } from "@/hooks";

export default function QueueBoardPage() {
  return (
    <Suspense fallback={<FullLoader />}>
      <QueueBoardContent />
    </Suspense>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
  );
}

function LiveClock() {
  const [t, setT] = useState(() =>
    new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(
      () => setT(new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })),
      10_000
    );
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{t}</span>;
}

/* ─── Types ─────────────────────────────────────────────────────────────── */

type SeatMember = {
  id: string;
  status: string;
  seat_id: string | null;
  seat?: { seat_number: number; label: string } | null;
};

type Ticket = {
  id: string;
  queue_number: string;
  status: string;
  party_size: number;
  seat_id?: string | null;
  customer?: { full_name?: string | null } | null;
  seat?: { seat_number: number; label: string } | null;
  ticket_seats?: SeatMember[];
};

type BranchSeat = {
  id: string;
  seat_number: number;
  label: string;
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * For a given seat id, find which active ticket is occupying it.
 * Checks both the top-level seat_id (single-person ticket) and ticket_seats (group ticket).
 */
function getTicketForSeat(seatId: string, tickets: Ticket[]): Ticket | null {
  for (const t of tickets) {
    if (t.status !== "in_service") continue;
    // Single-person ticket: seat assigned directly on the ticket
    if (t.seat_id === seatId) return t;
    // Group ticket: only count members actively in_service (not completed/cancelled)
    // When a barber clicks "Done", the member's status becomes "completed" → seat frees up
    if (t.ticket_seats?.some((m) => m.seat_id === seatId && m.status === "in_service")) return t;
  }
  return null;
}

/* ─── Sound ──────────────────────────────────────────────────────────────── */

/** Plays a three-note ascending chime (C5 → E5 → G5) via Web Audio API. */
function playCallChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch {
    // AudioContext unavailable — silently ignore
  }
}

/** Watches tickets and fires the chime whenever a new seat assignment appears. */
function useCallChime(tickets: Ticket[]) {
  // Track IDs of ticket_seats that are already in_service so we only chime on new ones.
  const seenSeatIds = useRef<Set<string>>(new Set());
  // Skip the very first render so we don't chime on page load.
  const initialized = useRef(false);

  useEffect(() => {
    const currentInServiceIds = new Set<string>();

    for (const t of tickets) {
      if (t.status === "in_service") {
        if (t.ticket_seats && t.ticket_seats.length > 0) {
          // Group ticket — track each individual seat assignment
          for (const ts of t.ticket_seats) {
            if (ts.status === "in_service") currentInServiceIds.add(ts.id);
          }
        } else {
          // Single ticket — use the ticket id itself
          currentInServiceIds.add(t.id);
        }
      }
    }

    if (!initialized.current) {
      // Seed known IDs on first load — no chime
      seenSeatIds.current = currentInServiceIds;
      initialized.current = true;
      return;
    }

    // Check for any newly assigned IDs
    let hasNew = false;
    for (const id of currentInServiceIds) {
      if (!seenSeatIds.current.has(id)) {
        hasNew = true;
        break;
      }
    }

    if (hasNew) playCallChime();
    seenSeatIds.current = currentInServiceIds;
  }, [tickets]);
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

function QueueBoardContent() {
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branch");
  const { data, isLoading, error } = useQueueBoard(branchId);

  const tickets = data?.data ?? [];
  const branchName = data?.branchName ?? "Branch";
  const seats: BranchSeat[] = data?.seats ?? [];

  useCallChime(tickets);

  /**
   * Tickets that still have unassigned members:
   * - pure waiting tickets, OR
   * - in_service tickets where fewer ticket_seats have a seat_id than the party_size
   *   (some group members haven't been assigned a chair yet)
   */
  const nextInLine = useMemo(() => {
    const waiting = tickets.filter((t) => t.status === "waiting");
    const partiallySeated = tickets.filter((t) => {
      if (t.status !== "in_service") return false;
      const assignedCount = (t.ticket_seats ?? []).filter(
        (m) => m.seat_id && m.status !== "cancelled"
      ).length;
      return assignedCount < (t.party_size ?? 1);
    });
    return [...waiting, ...partiallySeated];
  }, [tickets]);

  const waitingOnly = useMemo(() => tickets.filter((t) => t.status === "waiting"), [tickets]);
  const firstInLine = nextInLine.slice(0, 3);
  const waitingRest = waitingOnly.slice(3);

  if (!branchId)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] gap-2">
        <Scissors className="h-10 w-10 text-[#D4AF37]/40" />
        <p className="text-base font-bold text-gray-400">No branch selected</p>
        <p className="text-sm text-gray-700">/queue-board?branch=BRANCH_ID</p>
      </div>
    );

  if (isLoading) return <FullLoader />;

  if (error)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] gap-1">
        <p className="text-base font-bold text-red-400">Failed to load queue</p>
        <p className="text-sm text-gray-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-white/[0.05] bg-[#0c0c0c] px-4 py-2.5 sm:px-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15">
            <Scissors className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight sm:text-lg">
              BarberPro<span className="text-[#D4AF37]">.my</span>
            </span>
            <p className="text-[10px] text-gray-600 sm:text-[11px]">{branchName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm font-semibold sm:text-base">
            <LiveClock />
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-5 lg:flex-row lg:items-stretch lg:p-5">

        {/* LEFT — Seats Grid */}
        <div className="lg:w-[420px] xl:w-[480px] lg:shrink-0">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]/60">
            Now Serving
          </p>
          {seats.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {seats.map((seat) => {
                const ticket = getTicketForSeat(seat.id, tickets);
                return <SeatCard key={seat.id} seat={seat} ticket={ticket} />;
              })}
            </div>
          ) : (
            /* Fallback: no seats configured — show ticket-based cards */
            <TicketFallback tickets={tickets.filter((t) => t.status === "in_service")} />
          )}
        </div>

        {/* RIGHT — Queue list */}
        <div className="flex flex-1 flex-col gap-3 min-w-0 sm:gap-3">

          {/* Next in Line */}
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
              Next in Line
            </p>
            <div className="flex flex-col gap-2">
              {firstInLine.length > 0 ? (
                firstInLine.map((q, i) => (
                  <NextCard key={q.id} ticket={q} first={i === 0} partial={q.status === "in_service"} />
                ))
              ) : (
                <div className="rounded-xl border border-white/[0.04] bg-[#0d0d0d] py-5 text-center">
                  <p className="text-sm text-gray-700">No one waiting</p>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="flex-1">
            <p className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">
              Waiting Queue
              {waitingRest.length > 0 && (
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-gray-500">
                  {waitingRest.length}
                </span>
              )}
            </p>
            {waitingRest.length > 0 ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {waitingRest.map((q, i) => (
                  <WaitCard key={q.id} ticket={q} pos={i + 4} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.04] bg-[#0d0d0d] py-5 text-center">
                <p className="text-sm text-gray-700">Queue is clear</p>
              </div>
            )}
          </div>

          {/* VIP Promo */}
          <div className="rounded-xl border border-[#D4AF37]/12 bg-gradient-to-r from-[#D4AF37]/[0.07] to-transparent px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Star className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" />
                  Become a VIP Member Today!
                </p>
                <p className="mt-0.5 text-[11px] text-gray-600">
                  20% off all services + priority booking
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-wider text-gray-700">From</p>
                <p className="text-xl font-black text-[#D4AF37]">
                  RM 99<span className="text-xs font-medium text-gray-600">/mo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Seat Card ──────────────────────────────────────────────────────────── */

function SeatCard({ seat, ticket }: { seat: BranchSeat; ticket: Ticket | null }) {
  const occupied = !!ticket;
  const color = ticket ? getQueueColor(ticket.queue_number) : null;
  const customerName = ticket?.customer?.full_name ?? null;
  const party = ticket?.party_size ?? 1;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border transition-colors bg-[#0e0e0e] ${
        occupied ? "border-[#D4AF37]/30" : "border-white/[0.06] bg-[#0a0a0a]"
      }`}
    >
      {/* Top accent line — always gold when occupied */}
      <div
        className={`h-0.5 w-full ${
          occupied
            ? "bg-gradient-to-r from-[#D4AF37]/60 via-[#D4AF37] to-[#D4AF37]/60"
            : "bg-white/[0.04]"
        }`}
      />

      <div className="flex flex-col items-center gap-2 px-3 py-4">
        {/* Seat label */}
        <span className="text-xl font-black uppercase tracking-[0.15em] text-white">
          {seat.label || `Seat ${seat.seat_number}`}
        </span>

        {occupied ? (
          <>
            {/* Queue number — big and prominent */}
            <div
              className={`flex w-full items-center justify-center rounded-xl py-5`}
              style={{
                background: color!.bg,
                boxShadow: `0 8px 24px ${color!.shadow}`,
              }}
            >
              <span
                className={`font-black leading-none tracking-tight ${qFont(ticket!.queue_number, "lg")}`}
                style={{ color: color!.text }}
              >
                {ticket!.queue_number}
              </span>
            </div>

            {/* Customer name */}
            {customerName && (
              <p className="max-w-full truncate text-center text-xs font-semibold text-gray-400">
                {customerName}
              </p>
            )}

            {/* Group indicator — always gold */}
            {party > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/[0.08] px-2.5 py-0.5">
                <Users className="h-3 w-3 text-[#D4AF37]" />
                <span className="text-[10px] font-bold text-[#D4AF37]">{party} persons</span>
              </div>
            )}

            {/* In Service badge */}
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500">In Service</span>
            </div>
          </>
        ) : (
          <>
            {/* Empty seat placeholder */}
            <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-5">
              <Scissors className="h-7 w-7 text-white/[0.06]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-700">
              Available
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Ticket Fallback (no seats configured) ──────────────────────────────── */

function TicketFallback({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.06] py-12">
        <Scissors className="h-10 w-10 text-[#D4AF37]/10" />
        <p className="text-sm font-medium text-gray-700">No one in service</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {tickets.map((t) => {
        const color = getQueueColor(t.queue_number);
        return (
          <div
            key={t.id}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-[#0e0e0e]"
            style={{ borderColor: color.border }}
          >
            <div
              className="flex items-center justify-center rounded-l-2xl px-6 py-6"
              style={{ background: color.bg, boxShadow: `4px 0 20px ${color.shadow}` }}
            >
              <span
                className={`font-black leading-none ${qFont(t.queue_number, "lg")}`}
                style={{ color: color.text }}
              >
                {t.queue_number}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-4">
              <p className="text-sm font-bold text-white">{t.customer?.full_name ?? "Walk-in Guest"}</p>
              {(t.party_size ?? 1) > 1 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: color.bg }} />
                  <span className="text-xs font-semibold" style={{ color: color.bg }}>{t.party_size} persons</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500">In Service</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Next in Line Card ──────────────────────────────────────────────────── */

function NextCard({ ticket, first, partial }: { ticket: Ticket; first: boolean; partial?: boolean }) {
  const party = ticket.party_size ?? 1;
  const color = getQueueColor(ticket.queue_number);
  const assignedCount = (ticket.ticket_seats ?? []).filter(
    (m) => m.seat_id && m.status !== "cancelled"
  ).length;
  const pendingCount = party - assignedCount;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-1.5"
      style={{ borderColor: color.border, background: color.subtle }}
    >
      {/* Queue number block */}
      <div
        className="flex shrink-0 items-center justify-center rounded-xl py-3 px-3"
        style={{
          minWidth: "72px",
          background: color.bg,
          boxShadow: `0 4px 16px ${color.shadow}`,
        }}
      >
        <span
          className={`font-black leading-none tracking-[0.2px] ${qFont(ticket.queue_number, "md")}`}
          style={{ color: color.text }}
        >
          {ticket.queue_number}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">
          {ticket.customer?.full_name ?? "Walk-in Guest"}
        </p>
        {partial ? (
          <p className="text-[11px] font-semibold" style={{ color: color.bg }}>
            {pendingCount} member{pendingCount !== 1 ? "s" : ""} waiting for seat
          </p>
        ) : party > 1 ? (
          <p className="text-[11px] font-semibold" style={{ color: color.bg }}>{party} persons</p>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Wait Card ──────────────────────────────────────────────────────────── */

function WaitCard({ ticket, pos }: { ticket: Ticket; pos: number }) {
  const party = ticket.party_size ?? 1;
  const color = getQueueColor(ticket.queue_number);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-[#0d0d0d] px-3 py-2.5">
      <span className="w-4 shrink-0 text-center text-[10px] font-bold text-gray-700">{pos}</span>
      <div
        className="flex shrink-0 items-center justify-center rounded-lg py-1.5"
        style={{
          minWidth: "52px",
          background: color.bg,
          boxShadow: `0 2px 8px ${color.shadow}`,
        }}
      >
        <span
          className={`font-black leading-none ${qFont(ticket.queue_number, "sm")}`}
          style={{ color: color.text }}
        >
          {ticket.queue_number}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-white">
          {ticket.customer?.full_name ?? "Walk-in Guest"}
        </p>
        {party > 1 && (
          <p className="text-[10px] font-semibold" style={{ color: color.bg }}>{party} persons</p>
        )}
      </div>
    </div>
  );
}
