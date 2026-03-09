"use client";

import { Clock, Scissors, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { useQueueBoard } from "@/hooks";

export default function QueueBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Loading queue board...</p>
        </div>
      }
    >
      <QueueBoardContent />
    </Suspense>
  );
}

function QueueBoardContent() {
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branch");

  const { data, isLoading, error } = useQueueBoard(branchId);

  const tickets = data?.data ?? [];
  const branchName = data?.branchName ?? "Branch";

  const nowServing = useMemo(
    () => tickets.find((t) => t.status === "in_service"),
    [tickets]
  );
  const waiting = useMemo(
    () => tickets.filter((t) => t.status === "waiting")
  , [tickets]);
  const nextInLine = waiting.slice(0, 2);
  const waitingRest = waiting.slice(2);

  if (!branchId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <p className="text-xl font-medium text-gray-400">No branch selected</p>
        <p className="mt-2 text-sm text-gray-500">Use URL: /queue-board?branch=BRANCH_ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading queue...</p>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unable to fetch queue data for this branch.";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <p className="text-xl font-medium text-red-400">Failed to load queue</p>
        <p className="mt-2 max-w-xl text-center text-sm text-gray-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] p-6 font-sans text-white lg:p-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Scissors className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              BarberPro<span className="text-[#D4AF37]">.my</span>
            </h1>
            <p className="text-sm font-medium text-gray-400">{branchName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-5 w-5" />
          <span className="text-lg font-medium tabular-nums">
            {new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col">
          <div className="flex-1 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent p-8">
            <p className="text-lg font-bold uppercase tracking-widest text-white/80 mb-4">Now Serving</p>
            {nowServing ? (
              <>
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#D4AF37] text-6xl font-black text-[#0a0a0a] shadow-2xl shadow-[#D4AF37]/30">
                    {nowServing.queue_number}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white/90">
                    Barber: {nowServing.assigned_staff?.full_name ?? "—"}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-bold uppercase tracking-wider text-white/80 mb-1">Service</p>
                    <p className="text-2xl font-black text-white">
                      {nowServing.service?.name ?? "—"}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37]/20 px-4 py-2">
                    <Clock className="h-4 w-4 text-[#D4AF37]" />
                    <span className="text-xl font-bold tabular-nums text-[#D4AF37]">
                      {nowServing.called_at
                        ? formatDuration(nowServing.called_at)
                        : "—"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-12">
                <p className="text-2xl font-bold text-white/60">No one in service</p>
                <p className="mt-2 text-sm text-gray-500">Waiting for next customer</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-2xl font-black uppercase tracking-wide text-white">Next in Line</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {nextInLine.length > 0 ? (
                nextInLine.map((q, i) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-5 ${
                      i === 0
                        ? "border-orange-500/30 bg-orange-500/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-black ${
                          i === 0 ? "bg-orange-500 text-white" : "bg-[#1a1a1a] border border-white/10 text-gray-400"
                        }`}
                      >
                        {q.queue_number}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">
                          {q.customer?.full_name ?? "Walk-in Guest"}
                        </p>
                        <p className="text-sm text-gray-400">{q.service?.name ?? "—"}</p>
                        <p className="mt-1 text-sm font-medium text-orange-400">
                          ~{formatWait(q.created_at)} wait
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-gray-500">No one waiting</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-black uppercase tracking-wide text-white">
              Waiting Queue <span className="text-lg font-normal text-gray-500">({waitingRest.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {waitingRest.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] text-lg font-bold text-gray-400">
                    {q.queue_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {q.customer?.full_name ?? "Walk-in Guest"}
                    </p>
                    <p className="text-xs text-gray-500">{q.service?.name ?? "—"}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-400">
                    ~{formatWait(q.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#D4AF37]" /> Become a VIP Member Today!
                </p>
                <p className="text-sm text-gray-400">Get 20% off all services + priority booking</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Starting from</p>
                <p className="text-3xl font-black text-[#D4AF37]">
                  RM 99<span className="text-lg text-gray-400">/month</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(fromIso: string): string {
  const from = new Date(fromIso);
  const now = new Date();
  const diffMs = now.getTime() - from.getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatWait(fromIso: string): string {
  const from = new Date(fromIso);
  const now = new Date();
  const diffMs = now.getTime() - from.getTime();
  const mins = Math.floor(diffMs / 60000);
  return `${mins} min`;
}
