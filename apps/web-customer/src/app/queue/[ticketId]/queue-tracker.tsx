"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@barberpro/db/client";

type Props = {
  ticketId: string;
  initialQueueNumber: number;
  initialStatus: string;
  branchId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function QueueTracker({
  ticketId,
  initialQueueNumber,
  initialStatus,
  branchId,
  supabaseUrl,
  supabaseAnonKey,
}: Props) {
  const [queueNumber] = useState(initialQueueNumber);
  const [status, setStatus] = useState(initialStatus);
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);

    async function fetchPosition() {
      const { count } = await supabase
        .from("queue_tickets")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", branchId)
        .eq("status", "waiting")
        .lt("queue_number", queueNumber);

      setPosition(count !== null ? count + 1 : null);
    }

    fetchPosition();

    const channel = supabase
      .channel(`queue-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          setStatus(newStatus);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_tickets",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          fetchPosition();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, branchId, queueNumber, supabaseUrl, supabaseAnonKey]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    waiting: { label: "Waiting", color: "text-yellow-600" },
    in_service: { label: "Now Serving", color: "text-green-600" },
    completed: { label: "Completed", color: "text-muted-foreground" },
    cancelled: { label: "Cancelled", color: "text-red-600" },
    no_show: { label: "No Show", color: "text-red-600" },
  };

  const config = statusConfig[status] ?? statusConfig.waiting!;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border-2 border-border p-8">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Your Number</p>
        <p className="mt-2 text-6xl font-bold">{queueNumber}</p>
      </div>

      <div>
        <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
        {status === "waiting" && position !== null && (
          <p className="mt-1 text-muted-foreground">
            {position === 1
              ? "You're next!"
              : `${position - 1} ${position - 1 === 1 ? "person" : "people"} ahead of you`}
          </p>
        )}
        {status === "in_service" && (
          <p className="mt-1 text-muted-foreground">Please head to your seat</p>
        )}
      </div>
    </div>
  );
}
