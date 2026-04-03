"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash,
  ArrowRight,
  Scissors,
  Search,
  Loader2,
  X,
  RadioTower,
  Plus,
  MapPin,
  ChevronDown,
  ChevronUp,
  Users,
  LogIn,
  QrCode,
  Clock,
} from "lucide-react";

import { getActiveQueue } from "@/lib/active-queue";
import { joinQueueAsCustomerAction } from "@/app/bookings/actions";
import type { ShopForQueue, QueueTicket } from "./page";

// ─── Queue Ticket Card ───────────────────────────────────────────────────────

function QueueCard({ ticket }: { ticket: QueueTicket }) {
  const isActive = ticket.status === "waiting" || ticket.status === "in_service";
  const tenantName = (ticket.branches?.tenants as { name: string } | null)?.name;
  const branchName = ticket.branches?.name;
  const ticketDate = new Date(ticket.created_at);

  const statusCfg: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Waiting", cls: "text-[#D4AF37] bg-[#D4AF37]/10" },
    in_service: { label: "In Service", cls: "text-blue-400 bg-blue-400/10" },
    completed: { label: "Done", cls: "text-gray-500 bg-white/5" },
    paid: { label: "Done", cls: "text-gray-500 bg-white/5" },
    cancelled: { label: "Cancelled", cls: "text-red-400 bg-red-400/10" },
    no_show: { label: "No Show", cls: "text-red-400 bg-red-400/10" },
  };
  const cfg = statusCfg[ticket.status] ?? statusCfg.waiting!;

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
          isActive ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "bg-white/5 text-gray-500"
        }`}
      >
        {ticket.queue_number}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{tenantName ?? "Barbershop"}</p>
        <p className="truncate text-xs text-gray-500">
          {branchName}
          {" · "}
          {ticketDate.toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}
        </p>
      </div>

      <div className="shrink-0">
        {isActive ? (
          <Link
            href={`/queue/${ticket.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/25"
          >
            Track <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
            {cfg.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Join Queue Panel ─────────────────────────────────────────────────────────

type JoinStep = "search" | "branch" | "confirm";

function JoinQueuePanel({
  shops,
  onClose,
}: {
  shops: ShopForQueue[];
  onClose: () => void;
}) {
  const router = useRouter();
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
        router.push(`/queue/${result.ticketId}`);
      } else {
        setError(result.error);
      }
    });
  }

  const selectedBranch = selectedShop?.branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#141414]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2">
          {step !== "search" && (
            <button
              onClick={() =>
                setStep(
                  step === "confirm" && selectedShop && selectedShop.branches.length > 1
                    ? "branch"
                    : "search"
                )
              }
              className="rounded-lg p-1 text-gray-500 transition hover:bg-white/8 hover:text-gray-300"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
          )}
          <Hash className="h-4 w-4 text-[#D4AF37]" />
          <span className="text-sm font-bold text-white">Join a Walk-in Queue</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-500 transition hover:bg-white/8 hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        {/* Step 1: Search */}
        {step === "search" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 focus-within:border-[#D4AF37]/40">
              <Search className="h-4 w-4 shrink-0 text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by shop name or area…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-600">
                  {query ? `No shops found for "${query}"` : "No shops available"}
                </p>
              ) : (
                filtered.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => pickShop(shop)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-white/10 hover:bg-white/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Scissors className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{shop.name}</p>
                      {shop.branches[0]?.address && (
                        <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {shop.branches[0].address}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-600" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Branch */}
        {step === "branch" && selectedShop && (
          <div className="space-y-2">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Choose a branch at {selectedShop.name}
            </p>
            {selectedShop.branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setStep("confirm");
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 p-3.5 text-left transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{branch.name}</p>
                  {branch.address && (
                    <p className="mt-0.5 text-xs text-gray-500">{branch.address}</p>
                  )}
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedShop && selectedBranch && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-4 py-3">
              <Scissors className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{selectedShop.name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedBranch.name}</p>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
                <Users className="h-3.5 w-3.5 text-[#D4AF37]" />
                How many people?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={partySize <= 1}
                  onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-2xl font-black tabular-nums text-white">
                  {partySize}
                </span>
                <button
                  type="button"
                  disabled={partySize >= 20}
                  onClick={() => setPartySize((p) => Math.min(20, p + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">
                  {partySize === 1 ? "person" : "people"}
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-black text-[#111] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
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

// ─── Guest Active Queue Banner (from localStorage) ────────────────────────────

function GuestActiveBanner() {
  const [ticket, setTicket] = useState<{ ticketId: string; queueNumber: string; branchName: string } | null>(null);

  useEffect(() => {
    const stored = getActiveQueue();
    if (stored) setTicket(stored);
  }, []);

  if (!ticket) return null;

  return (
    <Link
      href={`/queue/${ticket.ticketId}`}
      className="flex items-center gap-4 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/8 p-4 transition hover:border-[#D4AF37]/50"
    >
      <div className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#D4AF37]">You have an active ticket</p>
        <p className="text-xs text-gray-400 truncate">
          {ticket.queueNumber} · {ticket.branchName}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF37]" />
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  queueTickets: QueueTicket[];
  shops: ShopForQueue[];
  isLoggedIn: boolean;
};

export function QueuePanel({ queueTickets, shops, isLoggedIn }: Props) {
  const [showJoinPanel, setShowJoinPanel] = useState(false);

  const activeTickets = queueTickets.filter((t) =>
    ["waiting", "in_service"].includes(t.status)
  );
  const pastTickets = queueTickets.filter(
    (t) => !["waiting", "in_service"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-white">
            <Hash className="h-6 w-6 text-[#D4AF37]" />
            Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoggedIn ? "Your active and past queue tickets" : "Walk-in queue tracker"}
          </p>
        </div>
        {!showJoinPanel && isLoggedIn && (
          <button
            type="button"
            onClick={() => setShowJoinPanel(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Join a queue
          </button>
        )}
      </div>

      {/* Join queue panel */}
      {showJoinPanel && (
        <JoinQueuePanel shops={shops} onClose={() => setShowJoinPanel(false)} />
      )}

      {/* Guest: check localStorage for active ticket */}
      {!isLoggedIn && <GuestActiveBanner />}

      {/* Active tickets */}
      <div className="rounded-2xl border border-white/10 bg-[#141414]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="flex items-center gap-2 font-bold text-white">
            <RadioTower className="h-4 w-4 text-[#D4AF37]" />
            Active
            {activeTickets.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
          </h2>
          {!showJoinPanel && isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowJoinPanel(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Join a queue
            </button>
          )}
        </div>

        {activeTickets.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Hash className="mx-auto h-10 w-10 text-gray-700" />
            <p className="mt-3 text-sm text-gray-500">No active queue tickets</p>
            {isLoggedIn && !showJoinPanel && (
              <button
                type="button"
                onClick={() => setShowJoinPanel(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] hover:underline"
              >
                <Hash className="h-3.5 w-3.5" /> Find & join a walk-in queue
              </button>
            )}
            {!isLoggedIn && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-600">
                  Scan a QR code at a barbershop to join the queue, or sign in to track your tickets here.
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Link
                    href="/login?next=/queue"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-white/20 hover:text-white"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign in
                  </Link>
                  <span className="text-xs text-gray-700">or scan a QR at the shop</span>
                  <QrCode className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 px-5">
            {activeTickets.map((ticket) => (
              <QueueCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

      {/* Past tickets */}
      {pastTickets.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#141414]">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <h2 className="font-semibold text-gray-400">Past Visits</h2>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-600">
              {pastTickets.length}
            </span>
          </div>
          <div className="divide-y divide-white/5 px-5 pb-2">
            {pastTickets.map((ticket) => (
              <QueueCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Logged-in: empty state with no history */}
      {isLoggedIn && queueTickets.length === 0 && !showJoinPanel && (
        <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <Hash className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-3 font-bold text-white">No queue history yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Join a walk-in queue at any BarberPro barbershop
          </p>
          <button
            type="button"
            onClick={() => setShowJoinPanel(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
          >
            <Hash className="h-4 w-4" /> Find & join a queue
          </button>
        </div>
      )}
    </div>
  );
}
