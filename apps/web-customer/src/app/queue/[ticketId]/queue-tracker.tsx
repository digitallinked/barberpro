"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, XCircle, Scissors, Share2, Copy, Check } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { setActiveQueue } from "@/lib/active-queue";

type Props = {
  ticketId: string;
  queueNumber: string;
  initialStatus: string;
  branchId: string;
  branchName: string;
};

type QueueInfo = {
  status: string;
  position: number;
  queue_number: string;
  now_serving: string | null;
  seat_label: string | null;
};

function playCalledChime() {
  try {
    const ctx = new AudioContext();
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
    // Web Audio not available
  }
}

export function QueueTracker({ ticketId, queueNumber, initialStatus, branchId, branchName }: Props) {
  const [info, setInfo] = useState<QueueInfo | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const chimePlayedRef = useRef(false);
  const prevStatusRef = useRef(initialStatus);

  // ── Sync to localStorage so the bottom banner works across pages ──
  useEffect(() => {
    setActiveQueue({
      ticketId,
      queueNumber,
      branchId,
      branchName,
      storedAt: Date.now(),
    });
  }, [ticketId, queueNumber, branchId, branchName]);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/queue-position?ticket_id=${encodeURIComponent(ticketId)}&branch_id=${encodeURIComponent(branchId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as QueueInfo;

      if (
        prevStatusRef.current !== "in_service" &&
        data.status === "in_service" &&
        !chimePlayedRef.current
      ) {
        chimePlayedRef.current = true;
        playCalledChime();
      }

      prevStatusRef.current = data.status;
      setStatus(data.status);
      setInfo(data);
    } catch {
      // silent — keep last known state
    }
  }, [ticketId, branchId]);

  useEffect(() => {
    void fetchInfo();

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`queue-tracker-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tickets",
          filter: `branch_id=eq.${branchId}`,
        },
        () => void fetchInfo()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId, branchId, fetchInfo]);

  const isWaiting = status === "waiting";
  const isServing = status === "in_service";
  const isDone = status === "completed";
  const isCancelled = status === "cancelled" || status === "no_show";

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Queue ${queueNumber} — ${branchName}`, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const positionLabel = (() => {
    if (!info) return "Loading position…";
    if (isServing) return info.seat_label ? `Head to ${info.seat_label}` : "Please proceed to the barber";
    if (isDone) return "Thank you for visiting!";
    if (isCancelled) return "This ticket is no longer active.";
    if (info.position <= 1) return "You're next!";
    return `${info.position - 1} ${info.position - 1 === 1 ? "person" : "people"} ahead of you`;
  })();

  return (
    <div className="mt-8 space-y-4">
      {/* ── Queue number hero ── */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-10 text-center transition-colors ${
          isServing
            ? "border-[#D4AF37]/60 bg-[#D4AF37]/8"
            : isCancelled
            ? "border-red-500/25 bg-red-500/5"
            : isDone
            ? "border-white/10 bg-white/3"
            : "border-white/10 bg-[#141414]"
        }`}
      >
        {/* Subtle radial glow when active */}
        {(isWaiting || isServing) && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: isServing
                ? "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,175,55,0.12), transparent)"
                : "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.06), transparent)",
            }}
          />
        )}

        {/* Live pulse indicator */}
        {isWaiting && (
          <div className="mb-4 flex justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
        )}

        {isServing && (
          <div className="mb-4 flex justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
            </span>
          </div>
        )}

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">
          Your number
        </p>
        <p
          className={`text-9xl font-black leading-none tabular-nums tracking-tight ${
            isServing
              ? "text-[#D4AF37]"
              : isCancelled || isDone
              ? "text-gray-600"
              : "text-white"
          }`}
        >
          {queueNumber}
        </p>

        {/* Position / status pill */}
        <div
          className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
            isServing
              ? "border-[#D4AF37]/40 bg-[#D4AF37]/10"
              : "border-white/10 bg-white/5"
          }`}
        >
          {isWaiting && <Clock className="h-3.5 w-3.5 text-gray-400" />}
          {isServing && <Scissors className="h-3.5 w-3.5 text-[#D4AF37]" />}
          {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-gray-500" />}
          {isCancelled && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          <p
            className={`text-sm font-medium ${
              isServing ? "text-[#D4AF37]" : isCancelled ? "text-red-400" : "text-gray-300"
            }`}
          >
            {positionLabel}
          </p>
        </div>

        {/* Now serving row */}
        {info?.now_serving && isWaiting && (
          <p className="mt-3 text-xs text-gray-600">
            Now serving: <span className="text-gray-400 font-semibold">{info.now_serving}</span>
          </p>
        )}
      </div>

      {/* ── Status detail card ── */}
      {isServing && (
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/20">
              <Scissors className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="font-bold text-[#D4AF37]">It&apos;s your turn!</p>
              {info?.seat_label ? (
                <p className="text-sm text-gray-400">
                  Please head to <span className="font-semibold text-white">{info.seat_label}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-400">Please proceed to the barber</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isDone && (
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
              <CheckCircle2 className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-white">Service completed</p>
              <p className="text-sm text-gray-500">Thanks for visiting {branchName}!</p>
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="font-bold text-red-400">
                {status === "no_show" ? "Marked as no-show" : "Ticket cancelled"}
              </p>
              <p className="text-sm text-gray-500">This ticket is no longer active.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Save / share link ── */}
      {(isWaiting || isServing) && (
        <div className="rounded-2xl border border-white/8 bg-[#141414] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
            Bookmark this page
          </p>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            This page is unique to your queue number. Save the link or share it — it works even after
            closing the browser.
          </p>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Link copied!</span>
              </>
            ) : (
              <>
                {typeof navigator !== "undefined" && "share" in navigator ? (
                  <Share2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Save or share this link
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Live indicator ── */}
      {(isWaiting || isServing) && (
        <p className="text-center text-[11px] text-gray-700">
          Updates automatically · No refresh needed
        </p>
      )}
    </div>
  );
}
