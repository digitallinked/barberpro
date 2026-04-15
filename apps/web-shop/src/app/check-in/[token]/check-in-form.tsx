"use client";

import { ChevronDown, ChevronUp, Scissors, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { CheckInService } from "./page";
import { QueueStatusView } from "./queue-status-view";

function clampPartySize(n: number): number {
  return Math.min(20, Math.max(1, n));
}

function parsedPartySize(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 1 : n;
}

type Props = {
  branchName: string;
  branchId: string;
  token: string;
  services: CheckInService[];
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

export function CheckInForm({ branchName, branchId, token, services }: Props) {
  const [fullName, setFullName] = useState("");
  const [partySizeInput, setPartySizeInput] = useState("1");
  const [phone, setPhone] = useState("");
  const [memberServiceIds, setMemberServiceIds] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const partySize = clampPartySize(parsedPartySize(partySizeInput) || 1);

  // Clear service selections when party size decreases
  useEffect(() => {
    setMemberServiceIds((prev) => {
      const next: Record<number, string> = {};
      for (let i = 0; i < partySize; i++) {
        if (prev[i]) next[i] = prev[i];
      }
      return next;
    });
  }, [partySize]);

  function setMemberService(memberIndex: number, serviceId: string) {
    setMemberServiceIds((prev) => ({
      ...prev,
      [memberIndex]: serviceId === prev[memberIndex] ? "" : serviceId,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const memberServices: MemberServiceSelection[] = Array.from({ length: partySize }, (_, i) => {
      const serviceId = memberServiceIds[i] ?? "";
      const service = services.find((s) => s.id === serviceId);
      return service
        ? { member_index: i, service_id: serviceId, service_name: service.name, service_price: service.price }
        : null;
    }).filter((x): x is MemberServiceSelection => x !== null);

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

  const hasServices = services.length > 0;

  return (
    <div className="mx-auto max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-[#D4AF37]/10 p-3">
          <Scissors className="h-6 w-6 text-[#D4AF37]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Walk-in Queue</p>
        <h1 className="text-3xl font-black text-white leading-tight">
          Welcome to<br />
          <span className="text-[#D4AF37]">{branchName}</span>
        </h1>
        <p className="mt-3 text-sm text-gray-500 max-w-xs mx-auto">
          Fill in your details below to join the queue. We&apos;ll call your number when it&apos;s your turn.
        </p>
      </div>

      <div className="space-y-4">
        {/* Main form card */}
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4">Your Details</p>

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
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20"
                placeholder="e.g. Ahmad"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-gray-400">
                Phone number{" "}
                <span className="text-gray-600 font-normal">(optional, for updates)</span>
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20"
                placeholder="e.g. 012-345 6789"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="party_size" className="mb-1.5 block text-xs font-medium text-gray-400">
                How many people joining? <span className="text-red-400">*</span>
              </label>
              <div className="flex overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] focus-within:border-[#D4AF37]/50 focus-within:ring-1 focus-within:ring-[#D4AF37]/20">
                <input
                  id="party_size"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
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
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-white outline-none"
                  placeholder="1"
                />
                <div className="flex w-11 shrink-0 flex-col border-l border-white/10">
                  <button
                    type="button"
                    aria-label="Increase"
                    disabled={parsedPartySize(partySizeInput) >= 20}
                    onClick={() => setPartySizeInput(String(clampPartySize(parsedPartySize(partySizeInput) + 1)))}
                    className="flex flex-1 items-center justify-center border-b border-white/10 py-1.5 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Decrease"
                    disabled={parsedPartySize(partySizeInput) <= 1}
                    onClick={() => setPartySizeInput(String(clampPartySize(parsedPartySize(partySizeInput) - 1)))}
                    className="flex flex-1 items-center justify-center py-1.5 text-[#D4AF37] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-member service selection */}
        {hasServices && Array.from({ length: partySize }, (_, memberIndex) => {
          const selectedId = memberServiceIds[memberIndex] ?? "";
          const label = partySize === 1 ? "Your Service" : `Person ${memberIndex + 1}`;
          const hint = partySize === 1
            ? "What service are you getting today?"
            : memberIndex === 0
              ? "What service are you getting today?"
              : `What service is person ${memberIndex + 1} getting?`;

          return (
            <div key={memberIndex} className="rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
              <p className="text-xs text-gray-600 mb-4">{hint}</p>

              <div className="grid grid-cols-2 gap-2">
                {services.map((s) => {
                  const isSelected = selectedId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setMemberService(memberIndex, s.id)}
                      className={`relative flex flex-col rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? "border-[#D4AF37]/60 bg-[#D4AF37]/10"
                          : "border-white/10 bg-[#0a0a0a] hover:border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37]">
                          <Check className="h-2.5 w-2.5 text-[#111]" strokeWidth={3} />
                        </span>
                      )}
                      <p className={`text-sm font-bold leading-snug ${isSelected ? "text-[#D4AF37]" : "text-white"}`}>
                        {s.name}
                      </p>
                      <p className={`mt-1 text-xs font-medium ${isSelected ? "text-[#D4AF37]/70" : "text-gray-500"}`}>
                        RM {s.price.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!selectedId && (
                <p className="mt-2.5 text-[11px] text-gray-600">
                  Optional, skip if unsure
                </p>
              )}
            </div>
          );
        })}

        {/* Submit */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={submitting || !fullName.trim()}
            className="w-full rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
          >
            {submitting ? "Joining queue…" : "Join the queue"}
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-600">
            We&apos;ll display your queue number on screen when it&apos;s your turn.
          </p>
        </form>
      </div>
    </div>
  );
}
