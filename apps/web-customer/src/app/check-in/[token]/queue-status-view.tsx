"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Scissors } from "lucide-react";
import { getQueueColor, queueCustomerHeroClass } from "@barberpro/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useQueuePositionPoll } from "@/lib/use-queue-position-poll";

type QueueStatus = {
  status: string;
  queue_number: string;
  position: number;
  now_serving: string | null;
  seat_label: string | null;
};

type Props = {
  ticketId: string;
  branchId: string;
  queueNumber: string;
  branchName: string;
};

export function QueueStatusView({ ticketId, branchId, queueNumber, branchName }: Props) {
  const [info, setInfo] = useState<QueueStatus>({
    status: "waiting",
    queue_number: queueNumber,
    position: 1,
    now_serving: null,
    seat_label: null,
  });
  const [loading, setLoading] = useState(true);

  const displayNumber = useMemo(() => {
    const n = info.queue_number?.trim();
    return n || queueNumber.trim() || queueNumber;
  }, [info.queue_number, queueNumber]);

  const ticketColor = useMemo(() => getQueueColor(displayNumber), [displayNumber]);
  const nowServingColor = useMemo(
    () => (info.now_serving ? getQueueColor(info.now_serving) : null),
    [info.now_serving]
  );

  const fetchPosition = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/queue-position?ticket_id=${encodeURIComponent(ticketId)}&branch_id=${encodeURIComponent(branchId)}`
      );
      if (res.ok) {
        const data = (await res.json()) as QueueStatus;
        setInfo(data);
      }
    } catch {
      // silent — keep last known state
    } finally {
      setLoading(false);
    }
  }, [ticketId, branchId]);

  useEffect(() => {
    void fetchPosition();

    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel(`queue-status-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tickets",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          void fetchPosition();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ticketId, branchId, fetchPosition]);

  const queueTerminal =
    info.status === "completed" || info.status === "cancelled" || info.status === "no_show";

  useQueuePositionPoll(fetchPosition, {
    enabled:
      !loading &&
      !queueTerminal &&
      (info.status === "waiting" || info.status === "in_service"),
  });

  const isCalled = info.status === "in_service";
  const isCompleted = info.status === "completed";
  const isCancelled = info.status === "cancelled";

  if (loading) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8 text-center">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isCalled) {
    return (
      <div
        className="mx-auto max-w-md rounded-2xl border p-8 text-center shadow-xl"
        style={{
          borderColor: ticketColor.border,
          background: `linear-gradient(180deg, ${ticketColor.subtle}, #141414)`,
          boxShadow: `0 20px 50px ${ticketColor.shadow}`,
        }}
      >
        <div className="flex justify-center mb-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: `${ticketColor.bg}22` }}
          >
            <Scissors className="h-8 w-8" style={{ color: ticketColor.bg }} />
          </div>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: ticketColor.bg }}>
          You&apos;re being called!
        </p>
        <div
          className="mx-auto flex max-w-[17rem] items-center justify-center rounded-2xl py-6 px-4 mb-4 ring-2 ring-[#D4AF37]/40"
          style={{
            background: ticketColor.bg,
            boxShadow: `0 12px 36px ${ticketColor.shadow}`,
          }}
        >
          <span
            className={`font-black tabular-nums ${queueCustomerHeroClass(displayNumber)}`}
            style={{ color: ticketColor.text }}
          >
            {displayNumber}
          </span>
        </div>
        {info.seat_label && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-3 mb-4">
            <span className="text-lg font-black text-[#D4AF37]">{info.seat_label}</span>
          </div>
        )}
        <p className="text-sm text-gray-400">
          {info.seat_label
            ? `Please proceed to ${info.seat_label}`
            : "Please proceed to the barber"}
        </p>
        <p className="mt-4 text-xs text-gray-600">Thank you for visiting {branchName}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-[#141414] p-8 text-center shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Service Complete</p>
        <p className="text-3xl font-black text-gray-500 mb-2 tabular-nums">{displayNumber}</p>
        <p className="mt-2 text-sm text-gray-400">Thank you for visiting {branchName}. See you again!</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-[#141414] p-8 text-center shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-red-400 mb-2">Ticket Cancelled</p>
        <p className="mt-2 text-sm text-gray-400">Your ticket was removed. Please check with staff to re-join the queue.</p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-md rounded-2xl border p-6 sm:p-8 text-center shadow-xl"
      style={{
        borderColor: ticketColor.border,
        background: `linear-gradient(180deg, ${ticketColor.subtle}, #141414)`,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Your number</p>

      <div
        className="mx-auto flex w-full max-w-[17rem] items-center justify-center rounded-2xl py-7 px-3 mb-5"
        style={{
          background: ticketColor.bg,
          boxShadow: `0 14px 40px ${ticketColor.shadow}`,
        }}
      >
        <span
          className={`font-black tabular-nums ${queueCustomerHeroClass(displayNumber)}`}
          style={{ color: ticketColor.text }}
        >
          {displayNumber}
        </span>
      </div>

      <p className="text-[10px] text-gray-600 mb-5">Same colour as on the shop screen</p>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-6">
        <div>
          <p className="text-2xl font-black text-white tabular-nums">{info.position}</p>
          <p className="text-xs text-gray-500 mt-0.5">in queue</p>
        </div>
        {info.now_serving && nowServingColor && (
          <div className="border-l border-white/10 pl-6 sm:pl-10 text-left">
            <div
              className="inline-flex min-w-[4.5rem] items-center justify-center rounded-lg px-2 py-1 font-black tabular-nums text-lg"
              style={{
                background: nowServingColor.bg,
                color: nowServingColor.text,
                boxShadow: `0 4px 14px ${nowServingColor.shadow}`,
              }}
            >
              {info.now_serving}
            </div>
            <p className="text-xs text-gray-500 mt-1">now serving</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live updates
      </div>

      <p className="mt-6 text-xs text-gray-600">{branchName} · Stay on this page to be notified</p>
    </div>
  );
}
