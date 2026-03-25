"use client";

import { useState } from "react";

type Props = {
  branchName: string;
  token: string;
};

export function CheckInForm({ branchName, token }: Props) {
  const [fullName, setFullName] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ queue_number: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
      const data = (await res.json()) as { error?: string; queue_number?: string; success?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      if (data.queue_number) setDone({ queue_number: data.queue_number });
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#D4AF37]/30 bg-[#141414] p-8 text-center shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wider text-[#D4AF37]">You&apos;re in the queue</p>
        <p className="mt-4 text-5xl font-black text-white">{done.queue_number}</p>
        <p className="mt-4 text-sm text-gray-400">Please wait to be called. Thank you for visiting {branchName}.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-xl">
      <h1 className="text-xl font-bold text-white">Join the queue</h1>
      <p className="mt-1 text-sm text-gray-400">{branchName}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
        )}
        <div>
          <label htmlFor="full_name" className="mb-1 block text-xs font-medium text-gray-400">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="full_name"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="party_size" className="mb-1 block text-xs font-medium text-gray-400">
            How many haircuts? <span className="text-red-400">*</span>
          </label>
          <input
            id="party_size"
            type="number"
            min={1}
            max={20}
            required
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-medium text-gray-400">
            Phone <span className="text-gray-600">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
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
  );
}
