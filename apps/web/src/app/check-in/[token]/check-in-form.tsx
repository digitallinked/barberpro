"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
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
};

type Done = {
  ticket_id: string;
  queue_number: string;
};

export function CheckInForm({ branchName, branchId, token }: Props) {
  const [fullName, setFullName] = useState("");
  const [partySizeInput, setPartySizeInput] = useState("1");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const partySize = Math.min(20, Math.max(1, parseInt(partySizeInput, 10) || 1));
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName.trim(),
          party_size: partySize,
          phone: phone.trim() || null,
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

  return (
    <div className="mx-auto max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-1">Walk-in Queue</p>
        <h1 className="text-2xl font-black text-white">{branchName}</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your details to join the queue</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
          )}
          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-xs font-medium text-gray-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="full_name"
              required
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="party_size" className="mb-1.5 block text-xs font-medium text-gray-400">
              How many haircuts? <span className="text-red-400">*</span>
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

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-gray-400">
              Phone <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20"
              placeholder="e.g. 012-345 6789"
              autoComplete="tel"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Joining…" : "Join queue"}
          </button>
        </form>
      </div>
    </div>
  );
}
