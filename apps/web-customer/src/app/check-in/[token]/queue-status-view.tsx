"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  async function fetchPosition() {
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
  }

  useEffect(() => {
    fetchPosition();

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

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, branchId]);

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
      <div className="mx-auto max-w-md rounded-2xl border border-[#D4AF37]/40 bg-[#141414] p-8 text-center shadow-xl shadow-[#D4AF37]/5">
        <div className="flex justify-center mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 text-4xl">
            ✂
          </span>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-2">
          You&apos;re being called!
        </p>
        <p className="text-5xl font-black text-white mb-4">{info.queue_number}</p>
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
        <p className="text-3xl font-black text-white mb-2">{info.queue_number}</p>
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
    <div className="mx-auto max-w-md rounded-2xl border border-[#D4AF37]/30 bg-[#141414] p-8 text-center shadow-xl">
      <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-1">Your number</p>
      <p className="text-6xl font-black text-white mb-6">{info.queue_number}</p>

      <div className="flex justify-center gap-8 mb-6">
        <div>
          <p className="text-2xl font-black text-white">{info.position}</p>
          <p className="text-xs text-gray-500 mt-0.5">in queue</p>
        </div>
        {info.now_serving && (
          <div className="border-l border-white/10 pl-8">
            <p className="text-2xl font-black text-[#D4AF37]">{info.now_serving}</p>
            <p className="text-xs text-gray-500 mt-0.5">now serving</p>
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
