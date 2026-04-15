"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, XCircle, Scissors, Share2, Copy, Check } from "lucide-react";
import { getQueueColor, queueCustomerHeroClass } from "@barberpro/types";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { setActiveQueue } from "@/lib/active-queue";
import { useQueuePositionPoll } from "@/lib/use-queue-position-poll";

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

  const displayNumber = useMemo(() => {
    const fromApi = info?.queue_number?.trim();
    if (fromApi) return fromApi;
    return queueNumber.trim() || queueNumber;
  }, [info?.queue_number, queueNumber]);

  const ticketColor = useMemo(() => getQueueColor(displayNumber), [displayNumber]);
  const nowServingColor = useMemo(
    () => (info?.now_serving ? getQueueColor(info.now_serving) : null),
    [info?.now_serving]
  );

  useEffect(() => {
    setActiveQueue({
      ticketId,
      queueNumber: displayNumber,
      branchId,
      branchName,
      storedAt: Date.now(),
    });
  }, [ticketId, displayNumber, branchId, branchName]);

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

  useQueuePositionPoll(fetchInfo, {
    enabled: status === "waiting" || status === "in_service",
  });

  const isWaiting = status === "waiting";
  const isServing = status === "in_service";
  const isDone = status === "completed";
  const isCancelled = status === "cancelled" || status === "no_show";
  const showColorTicket = !isDone && !isCancelled;

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Queue ${displayNumber} at ${branchName}`, url });
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
    <div className="mt-6 space-y-4">
      {/* ── Queue number hero (matches shop queue board colours) ── */}
      <div
        className={`relative rounded-3xl border text-center transition-colors duration-300 ${
          showColorTicket ? "p-5 sm:p-7" : "border-white/10 bg-[#141414] p-8"
        }`}
        style={
          showColorTicket
            ? {
                borderColor: ticketColor.border,
                background: `linear-gradient(180deg, ${ticketColor.subtle} 0%, rgba(0,0,0,0.35) 100%)`,
              }
            : undefined
        }
      >
        {/* Soft glow behind coloured ticket — no overflow:hidden so text never clips */}
        {showColorTicket && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-90"
            style={{
              boxShadow: `inset 0 0 80px ${ticketColor.subtle}`,
            }}
          />
        )}

        <div className="relative z-[1]">
          {isWaiting && (
            <div className="mb-3 flex justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
          )}

          {isServing && (
            <div className="mb-3 flex justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: ticketColor.bg }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: ticketColor.bg }} />
              </span>
            </div>
          )}

          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 mb-3">
            Your number
          </p>

          {showColorTicket ? (
            <div className="mx-auto w-full max-w-full px-1">
              <div
                className={`mx-auto flex w-full max-w-[19rem] sm:max-w-[21rem] items-center justify-center rounded-2xl py-7 sm:py-9 px-3 sm:px-5 ${
                  isServing ? "ring-2 ring-[#D4AF37]/50 ring-offset-2 ring-offset-[#0a0a0a]" : ""
                }`}
                style={{
                  background: ticketColor.bg,
                  boxShadow: `0 16px 48px ${ticketColor.shadow}, 0 0 0 1px rgba(255,255,255,0.06) inset`,
                }}
              >
                <span
                  className={`font-black tabular-nums select-none ${queueCustomerHeroClass(displayNumber)}`}
                  style={{ color: ticketColor.text }}
                >
                  {displayNumber}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-gray-600">
                Same colour as on the shop screen
              </p>
            </div>
          ) : (
            <p className="text-[clamp(2rem,12vw,3.5rem)] font-black leading-none tracking-tight text-gray-600 tabular-nums">
              {displayNumber}
            </p>
          )}

          {/* Position / status pill */}
          <div
            className={`mt-5 inline-flex max-w-[95%] items-center gap-2 rounded-full border px-4 py-2.5 ${
              showColorTicket ? "bg-black/25 backdrop-blur-sm" : "border-white/10 bg-white/5"
            }`}
            style={
              showColorTicket
                ? { borderColor: ticketColor.border }
                : undefined
            }
          >
            {isWaiting && <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
            {isServing && <Scissors className="h-3.5 w-3.5 shrink-0" style={{ color: ticketColor.bg }} />}
            {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
            {isCancelled && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
            <p
              className={`text-left text-sm font-medium leading-snug ${
                isServing ? "text-white" : isCancelled ? "text-red-400" : "text-gray-300"
              }`}
            >
              {positionLabel}
            </p>
          </div>

          {/* Now serving */}
          {info?.now_serving && isWaiting && nowServingColor && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-gray-600">Now serving</span>
              <span
                className="inline-flex items-center rounded-lg px-2.5 py-1 font-black tabular-nums"
                style={{
                  background: nowServingColor.bg,
                  color: nowServingColor.text,
                  boxShadow: `0 4px 14px ${nowServingColor.shadow}`,
                }}
              >
                {info.now_serving}
              </span>
            </div>
          )}
        </div>
      </div>

      {isServing && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: ticketColor.border,
            background: ticketColor.subtle,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${ticketColor.bg}33` }}
            >
              <Scissors className="h-5 w-5" style={{ color: ticketColor.bg }} />
            </div>
            <div>
              <p className="font-bold text-white">It&apos;s your turn!</p>
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
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

      {(isWaiting || isServing) && (
        <div
          className="rounded-2xl border border-white/8 bg-[#141414] p-5"
          style={{ boxShadow: showColorTicket ? `0 0 0 1px ${ticketColor.subtle} inset` : undefined }}
        >
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

      {(isWaiting || isServing) && (
        <p className="text-center text-[11px] text-gray-700">
          Updates automatically · No refresh needed
        </p>
      )}
    </div>
  );
}
