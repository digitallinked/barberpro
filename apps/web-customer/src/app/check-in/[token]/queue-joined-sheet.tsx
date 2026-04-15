"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CalendarClock, Scissors } from "lucide-react";

type Props = {
  queueNumber: string;
  branchName: string;
  branchId: string;
  ticketId: string;
};

type PositionInfo = {
  position: number;
  now_serving: string | null;
};

export function QueueJoinedSheet({ queueNumber, branchName, branchId, ticketId }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [posInfo, setPosInfo] = useState<PositionInfo | null>(null);

  // Animate in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Fetch initial position
  useEffect(() => {
    fetch(`/api/queue-position?ticket_id=${encodeURIComponent(ticketId)}&branch_id=${encodeURIComponent(branchId)}`)
      .then((r) => r.json())
      .then((d: PositionInfo) => setPosInfo(d))
      .catch(() => null);
  }, [ticketId, branchId]);

  function handleGoToBookings() {
    setVisible(false);
    setTimeout(() => router.push("/bookings"), 280);
  }

  const positionLabel = (() => {
    if (!posInfo) return "Loading position…";
    if (posInfo.position <= 1) return "You're next!";
    return `${posInfo.position - 1} ${posInfo.position - 1 === 1 ? "person" : "people"} ahead of you`;
  })();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleGoToBookings}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="rounded-t-3xl border-t border-white/10 bg-[#141414] px-6 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* Drag handle */}
          <div className="mx-auto mb-5 mt-3 h-1 w-10 rounded-full bg-white/10" />

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">You&apos;re in the queue!</p>
            </div>
            <button
              onClick={handleGoToBookings}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-gray-400 transition hover:bg-white/12 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Queue number hero */}
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center justify-center rounded-full bg-[#D4AF37]/10 p-3">
              <Scissors className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">Your number</p>
            <p className="text-8xl font-black text-white tracking-tight leading-none">{queueNumber}</p>

            {/* Position */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <p className="text-sm text-gray-300">{positionLabel}</p>
            </div>

            <p className="mt-3 text-xs text-gray-600">{branchName}</p>
          </div>

          {/* Notification nudge */}
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 px-4 py-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20">
              <span className="text-[10px]">🔔</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              A banner will stay on-screen while you wait. We&apos;ll alert you with a sound when your turn comes.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleGoToBookings}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-4 text-sm font-black text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <CalendarClock className="h-4 w-4" />
            View in My Bookings
          </button>

          <p className="mt-3 text-center text-[11px] text-gray-600">
            Your number will stay visible in the queue bar at the bottom
          </p>
        </div>
      </div>
    </>
  );
}
