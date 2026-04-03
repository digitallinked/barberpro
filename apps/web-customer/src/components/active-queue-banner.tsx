"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Scissors } from "lucide-react";
import { getQueueColor } from "@barberpro/types";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { clearActiveQueue, getActiveQueue, type ActiveQueueTicket } from "@/lib/active-queue";

type QueueInfo = {
  status: string;
  position: number;
  queue_number: string;
  now_serving: string | null;
  seat_label: string | null;
};

// ─── Audio ───────────────────────────────────────────────────────────────────

function playCalledChime() {
  try {
    const ctx = new AudioContext();
    // Ascending major triad C5-E5-G5 then high C6
    const notes: [number, number][] = [
      [523.25, 0],
      [659.25, 0.2],
      [783.99, 0.4],
      [1046.5, 0.65],
    ];
    notes.forEach(([freq, when]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + when);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + when + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.6);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + 0.7);
    });
  } catch {
    // Web Audio not available — silent fail
  }
}

// ─── Called fullscreen overlay ────────────────────────────────────────────────

function CalledOverlay({
  ticket,
  info,
  onDismiss,
}: {
  ticket: ActiveQueueTicket;
  info: QueueInfo;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const ticketColor = useMemo(() => getQueueColor(ticket.queueNumber), [ticket.queueNumber]);

  function handleGo() {
    onDismiss();
    router.push(`/queue/${ticket.ticketId}`);
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-md px-6 text-center">
      {/* Pulsing ring */}
      <div className="relative mb-8 flex items-center justify-center">
        <span className="absolute h-28 w-28 animate-ping rounded-full bg-[#D4AF37]/20 [animation-duration:1.5s]" />
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-[#D4AF37]/30 [animation-duration:1.5s] [animation-delay:0.3s]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 ring-2 ring-[#D4AF37]/60">
          <Scissors className="h-7 w-7 text-[#D4AF37]" strokeWidth={1.75} />
        </div>
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
        It&apos;s Your Turn!
      </p>
      <div
        className="mb-5 rounded-2xl px-6 py-5 ring-2 ring-[#D4AF37]/40"
        style={{
          background: ticketColor.bg,
          boxShadow: `0 16px 48px ${ticketColor.shadow}`,
        }}
      >
        <p
          className="text-[clamp(3rem,18vw,5rem)] font-black leading-none tracking-tight tabular-nums"
          style={{ color: ticketColor.text }}
        >
          {ticket.queueNumber}
        </p>
      </div>

      {info.seat_label ? (
        <div className="mb-5 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-8 py-4">
          <p className="text-xs text-gray-500 mb-1">Proceed to</p>
          <p className="text-2xl font-black text-[#D4AF37]">{info.seat_label}</p>
        </div>
      ) : (
        <p className="mb-5 text-base text-gray-400">Please proceed to the barber</p>
      )}

      <p className="mb-8 text-xs text-gray-600">{ticket.branchName}</p>

      <button
        onClick={handleGo}
        className="w-full max-w-xs rounded-2xl bg-[#D4AF37] py-4 text-base font-black text-[#111] shadow-xl shadow-[#D4AF37]/30 transition hover:brightness-110 active:scale-[0.97]"
      >
        Got it — I&apos;m heading over →
      </button>

      <button
        onClick={onDismiss}
        className="mt-4 text-xs text-gray-600 underline underline-offset-2 hover:text-gray-400 transition"
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── Floating pill banner ─────────────────────────────────────────────────────

export function ActiveQueueBanner() {
  const router = useRouter();
  const [ticket, setTicket] = useState<ActiveQueueTicket | null>(null);
  const ticketColor = ticket ? getQueueColor(ticket.queueNumber) : null;
  const [info, setInfo] = useState<QueueInfo | null>(null);
  const [showCalledOverlay, setShowCalledOverlay] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const chimePlayedRef = useRef(false);

  const fetchStatus = useCallback(async (t: ActiveQueueTicket) => {
    try {
      const res = await fetch(
        `/api/queue-position?ticket_id=${encodeURIComponent(t.ticketId)}&branch_id=${encodeURIComponent(t.branchId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as QueueInfo;

      // Transition into in_service → chime + overlay
      if (
        prevStatusRef.current !== "in_service" &&
        data.status === "in_service" &&
        !chimePlayedRef.current
      ) {
        chimePlayedRef.current = true;
        playCalledChime();
        setShowCalledOverlay(true);
      }

      // Auto-clear completed / cancelled after a moment
      if (data.status === "completed" || data.status === "cancelled") {
        setTimeout(() => {
          clearActiveQueue();
          setTicket(null);
        }, 4000);
      }

      prevStatusRef.current = data.status;
      setInfo(data);
    } catch {
      // silent — keep last known state
    }
  }, []);

  useEffect(() => {
    const stored = getActiveQueue();
    if (!stored) return;
    setTicket(stored);
    void fetchStatus(stored);

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`active-banner-${stored.ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tickets",
          filter: `branch_id=eq.${stored.branchId}`,
        },
        () => void fetchStatus(stored)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  if (!ticket) return null;

  const isCalled = info?.status === "in_service";
  const isDone =
    info?.status === "completed" || info?.status === "cancelled";

  function dismiss() {
    clearActiveQueue();
    setTicket(null);
    setShowCalledOverlay(false);
  }

  const positionText = (() => {
    if (!info) return "Loading…";
    if (isCalled) return "YOUR TURN!";
    if (info.position <= 1) return "You're next!";
    return `${info.position - 1} ahead`;
  })();

  return (
    <>
      {/* Fullscreen called overlay */}
      {showCalledOverlay && info && (
        <CalledOverlay
          ticket={ticket}
          info={info}
          onDismiss={() => setShowCalledOverlay(false)}
        />
      )}

      {/* Floating pill — sits just above mobile bottom nav */}
      <div
        className={`fixed inset-x-0 bottom-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom))+0.5rem)] z-40 flex justify-center px-3 md:bottom-4 transition-all duration-500 ${
          isDone ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"
        }`}
        aria-live="polite"
      >
        <div
          className={`flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl transition-all duration-300 ${
            isCalled
              ? "border-[#D4AF37]/80 bg-[#D4AF37] shadow-[#D4AF37]/30"
              : "border-[#D4AF37]/25 bg-[#161a1f]/95 shadow-black/50 backdrop-blur-xl"
          }`}
        >
          {/* Live dot / called icon */}
          {isCalled ? (
            <span className="text-lg shrink-0">✂️</span>
          ) : (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}

          {/* Tap to go to queue status page */}
          <button
            type="button"
            onClick={() => router.push(`/queue/${ticket.ticketId}`)}
            className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
          >
            {isCalled ? (
              <span className="text-sm font-black tabular-nums text-[#111]">{ticket.queueNumber}</span>
            ) : ticketColor ? (
              <span
                className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-black tabular-nums shadow-md"
                style={{
                  background: ticketColor.bg,
                  color: ticketColor.text,
                  boxShadow: `0 4px 12px ${ticketColor.shadow}`,
                }}
              >
                {ticket.queueNumber}
              </span>
            ) : (
              <span className="text-sm font-black tabular-nums text-white">{ticket.queueNumber}</span>
            )}
            <span
              className={`truncate text-xs font-medium ${
                isCalled ? "text-[#111]/70" : "text-gray-400"
              }`}
            >
              {positionText}
            </span>
            <span
              className={`ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                isCalled ? "text-[#111]/60" : "text-[#D4AF37]/70"
              }`}
            >
              {isCalled ? "Go now →" : "View →"}
            </span>
          </button>

          {/* Dismiss × */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss queue banner"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
              isCalled
                ? "bg-[#111]/10 text-[#111]/60 hover:bg-[#111]/20"
                : "bg-white/8 text-gray-500 hover:bg-white/15 hover:text-gray-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
