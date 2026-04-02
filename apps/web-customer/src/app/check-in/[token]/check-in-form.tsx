"use client";

import { ChevronDown, ChevronUp, Scissors, Check, User, LogIn, UserPlus, ChevronRight, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { CheckInService, LoggedInUser } from "./page";
import { QueueStatusView } from "./queue-status-view";

function clampPartySize(n: number): number {
  return Math.min(20, Math.max(1, n));
}

function parsedPartySize(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 1 : n;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

type Screen = "auth-choice" | "form" | "done";

type Props = {
  branchName: string;
  branchId: string;
  token: string;
  services: CheckInService[];
  loggedInUser: LoggedInUser | null;
};

type Done = {
  ticket_id: string;
  queue_number: string;
};

export type MemberServiceSelection = {
  member_index: number;
  service_id: string;
  service_name: string;
  service_price: number;
};

export function CheckInForm({ branchName, branchId, token, services, loggedInUser }: Props) {
  const [screen, setScreen] = useState<Screen>(loggedInUser ? "form" : "auth-choice");
  const [fullName, setFullName] = useState(loggedInUser?.name ?? "");
  const [partySizeInput, setPartySizeInput] = useState("1");
  const [phone, setPhone] = useState(loggedInUser?.phone ?? "");
  const [memberServiceIds, setMemberServiceIds] = useState<Record<number, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);

  const partySize = clampPartySize(parsedPartySize(partySizeInput) || 1);

  useEffect(() => {
    setMemberServiceIds((prev) => {
      const next: Record<number, string[]> = {};
      for (let i = 0; i < partySize; i++) {
        if (prev[i]?.length) next[i] = prev[i];
      }
      return next;
    });
  }, [partySize]);

  function toggleMemberService(memberIndex: number, serviceId: string) {
    setMemberServiceIds((prev) => {
      const current = prev[memberIndex] ?? [];
      const exists = current.includes(serviceId);
      return {
        ...prev,
        [memberIndex]: exists ? current.filter((id) => id !== serviceId) : [...current, serviceId],
      };
    });
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);

    const memberServices: MemberServiceSelection[] = Array.from({ length: partySize }, (_, i) => {
      const selectedIds = memberServiceIds[i] ?? [];
      return selectedIds
        .map((serviceId) => {
          const service = services.find((s) => s.id === serviceId);
          return service
            ? { member_index: i, service_id: serviceId, service_name: service.name, service_price: service.price }
            : null;
        })
        .filter((x): x is MemberServiceSelection => x !== null);
    }).flat();

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName.trim(),
          party_size: partySize,
          phone: phone.trim() || null,
          member_services: memberServices,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ticket_id?: string;
        queue_number?: string;
        success?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      if (data.ticket_id && data.queue_number) {
        setDone({ ticket_id: data.ticket_id, queue_number: data.queue_number });
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <QueueStatusView
        ticketId={done.ticket_id}
        branchId={branchId}
        queueNumber={done.queue_number}
        branchName={branchName}
      />
    );
  }

  // ─── Auth Choice Screen ───────────────────────────────────────────────────
  if (screen === "auth-choice") {
    return (
      <div className="mx-auto max-w-md">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[#D4AF37]/10 p-4 ring-1 ring-[#D4AF37]/20">
            <Scissors className="h-7 w-7 text-[#D4AF37]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Walk-in Queue</p>
          <h1 className="text-3xl font-black text-white leading-tight">
            Welcome to<br />
            <span className="text-[#D4AF37]">{branchName}</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Join the queue in seconds. Sign in for a faster experience, or continue as a guest.
          </p>
        </div>

        <div className="space-y-3">
          {/* Sign In option */}
          <a
            href={`/login?next=/check-in/${token}`}
            className="group flex items-center gap-4 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-5 py-4 transition-all hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
              <LogIn className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Sign in to BarberPro</p>
              <p className="text-xs text-gray-500 mt-0.5">Auto-fill details · Track history · Earn loyalty</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#D4AF37]/60 transition-transform group-hover:translate-x-0.5" />
          </a>

          {/* Sign Up option */}
          <a
            href={`/register?next=/check-in/${token}`}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 transition-all hover:border-white/20"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <UserPlus className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Create an account</p>
              <p className="text-xs text-gray-500 mt-0.5">Free · Takes 30 seconds · Never miss your turn</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
          </a>

          {/* Divider */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[11px] text-gray-600 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Guest option */}
          <button
            type="button"
            onClick={() => setScreen("form")}
            className="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-[#111] px-5 py-4 transition-all hover:border-white/15"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-300">Continue as guest</p>
              <p className="text-xs text-gray-600 mt-0.5">No account needed · Enter your details manually</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-700 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-700">
          By joining the queue you agree to our{" "}
          <a href="/privacy" className="text-gray-500 underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    );
  }

  // ─── Form Screen ─────────────────────────────────────────────────────────
  const hasServices = services.length > 0;
  const isLoggedIn = loggedInUser !== null;
  const initials = isLoggedIn ? getInitials(loggedInUser!.name || loggedInUser!.email) : null;

  return (
    <div className="mx-auto max-w-md">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-[#D4AF37]/10 p-3 ring-1 ring-[#D4AF37]/20">
          <Scissors className="h-6 w-6 text-[#D4AF37]" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Walk-in Queue</p>
        <h1 className="text-3xl font-black text-white leading-tight">
          Welcome to<br />
          <span className="text-[#D4AF37]">{branchName}</span>
        </h1>
      </div>

      <div className="space-y-4">
        {/* ── Logged-in: Identity card ── */}
        {isLoggedIn && !editingDetails ? (
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/8 to-[#141414] p-5 shadow-xl">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/20 ring-1 ring-[#D4AF37]/30 text-sm font-black text-[#D4AF37]">
                {initials || <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/70 mb-0.5">Signed in as</p>
                <p className="text-base font-bold text-white truncate">{fullName || loggedInUser!.email}</p>
                {phone && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-500 transition hover:border-white/20 hover:text-gray-300"
                aria-label="Edit details"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Verified badge */}
            <div className="mt-3 flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
              <p className="text-[11px] text-emerald-400/80">Details auto-filled from your account</p>
            </div>
          </div>
        ) : (
          /* ── Details Form Card ── */
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Your Details</p>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setScreen("auth-choice")}
                  className="text-[11px] text-[#D4AF37]/70 hover:text-[#D4AF37] transition"
                >
                  ← Back
                </button>
              )}
              {isLoggedIn && editingDetails && (
                <button
                  type="button"
                  onClick={() => setEditingDetails(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-300 transition"
                >
                  Done editing
                </button>
              )}
            </div>

            <div className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Your name <span className="text-red-400">*</span>
                </label>
                <input
                  id="full_name"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                  placeholder="e.g. Ahmad"
                  autoComplete="name"
                  autoFocus={!isLoggedIn}
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Phone number{" "}
                  <span className="text-gray-600 font-normal">(optional — for updates)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                  placeholder="e.g. 012-345 6789"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Party Size ── */}
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Party Size</p>
          <p className="text-xs text-gray-600 mb-4">How many people are joining the queue?</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Decrease"
              disabled={parsedPartySize(partySizeInput) <= 1}
              onClick={() => setPartySizeInput(String(clampPartySize(parsedPartySize(partySizeInput) - 1)))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div className="flex flex-1 items-center justify-center">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={partySizeInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") { setPartySizeInput(""); return; }
                  if (!/^\d+$/.test(v)) return;
                  const n = Number(v);
                  if (n > 20) return;
                  setPartySizeInput(v);
                }}
                onBlur={() => {
                  if (partySizeInput === "" || Number(partySizeInput) < 1) setPartySizeInput("1");
                }}
                className="w-16 border-0 bg-transparent text-center text-3xl font-black text-white outline-none"
              />
            </div>
            <button
              type="button"
              aria-label="Increase"
              disabled={parsedPartySize(partySizeInput) >= 20}
              onClick={() => setPartySizeInput(String(clampPartySize(parsedPartySize(partySizeInput) + 1)))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          {partySize > 1 && (
            <p className="mt-3 text-center text-xs text-gray-600">{partySize} people · each can pick a service below</p>
          )}
        </div>

        {/* ── Service Picker ── */}
        {hasServices && Array.from({ length: partySize }, (_, memberIndex) => {
          const selectedIds = memberServiceIds[memberIndex] ?? [];
          const label = partySize === 1 ? "Services" : `Person ${memberIndex + 1} — Services`;
          const totalPrice = selectedIds.reduce((sum, id) => {
            const s = services.find((sv) => sv.id === id);
            return sum + (s?.price ?? 0);
          }, 0);

          return (
            <div key={memberIndex} className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl">
              <div className="flex items-start justify-between mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                {selectedIds.length > 0 && (
                  <span className="text-[11px] font-bold text-[#D4AF37]">
                    {selectedIds.length} selected · RM {totalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {partySize === 1
                  ? "Pick one or more — e.g. Haircut + Beard Trim"
                  : memberIndex === 0
                    ? "Pick your services — you can select multiple"
                    : `Pick services for person ${memberIndex + 1}`}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {services.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleMemberService(memberIndex, s.id)}
                      className={`relative flex flex-col rounded-xl border p-3.5 text-left transition active:scale-[0.98] ${
                        isSelected
                          ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 shadow-sm shadow-[#D4AF37]/10"
                          : "border-white/10 bg-[#0a0a0a] hover:border-white/20"
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <span className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded border transition ${
                        isSelected
                          ? "border-[#D4AF37] bg-[#D4AF37]"
                          : "border-white/20 bg-transparent"
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-[#111]" strokeWidth={3.5} />}
                      </span>
                      <p className={`pr-5 text-sm font-bold leading-snug ${isSelected ? "text-[#D4AF37]" : "text-white"}`}>
                        {s.name}
                      </p>
                      <p className={`mt-1 text-xs font-medium ${isSelected ? "text-[#D4AF37]/70" : "text-gray-500"}`}>
                        RM {s.price.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedIds.length === 0 && (
                <p className="mt-3 text-[11px] text-gray-600">
                  Optional — skip if unsure
                </p>
              )}
              {selectedIds.length > 1 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
                  <p className="text-[11px] text-emerald-400/70">
                    {selectedIds.length} services · total RM {totalPrice.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="button"
          onClick={() => { void handleSubmit(); }}
          disabled={submitting || !fullName.trim()}
          className="w-full rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
        >
          {submitting ? "Joining queue…" : "Join the queue →"}
        </button>

        {/* ── Footer ── */}
        <div className="text-center space-y-1.5 pb-4">
          <p className="text-[11px] text-gray-600">
            We&apos;ll display your queue number on screen when it&apos;s your turn.
          </p>
          {!isLoggedIn && (
            <p className="text-[11px] text-gray-700">
              Have an account?{" "}
              <a href={`/login?next=/check-in/${token}`} className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition underline underline-offset-2">
                Sign in for auto-fill
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
