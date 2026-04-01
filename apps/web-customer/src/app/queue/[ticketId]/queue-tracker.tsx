"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@barberpro/db/client";
import { CheckCircle2, Clock, XCircle, Scissors, RefreshCw } from "lucide-react";

const AVG_MINUTES_PER_PERSON = 15;

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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPosition = useCallback(async () => {
    const supabase = createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);
    const { count } = await supabase
      .from("queue_tickets")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .eq("status", "waiting")
      .lt("queue_number", queueNumber);

    setPosition(count !== null ? count + 1 : null);
    setLastUpdated(new Date());
  }, [branchId, queueNumber, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);

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
          setLastUpdated(new Date());
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
  }, [ticketId, branchId, fetchPosition, supabaseUrl, supabaseAnonKey]);

  const isWaiting = status === "waiting";
  const isServing = status === "in_service";
  const isDone = status === "completed";
  const isCancelled = status === "cancelled" || status === "no_show";

  const estimatedWait =
    isWaiting && position !== null && position > 1
      ? (position - 1) * AVG_MINUTES_PER_PERSON
      : null;

  return (
    <div className="mt-8 space-y-5">
      {/* Queue number card */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-8 text-center transition-colors ${
          isServing
            ? "border-primary/70 bg-primary/5"
            : isDone
            ? "border-border bg-card"
            : isCancelled
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card"
        }`}
      >
        {isServing && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(43 65% 52% / 0.15), transparent)",
            }}
          />
        )}

        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Number</p>
        <p
          className={`mt-2 text-8xl font-bold leading-none tabular-nums ${
            isServing ? "text-primary" : isDone || isCancelled ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {queueNumber}
        </p>

        {estimatedWait !== null && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            ~{estimatedWait} min estimated wait
          </div>
        )}
      </div>

      {/* Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        {isWaiting && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary">Waiting</p>
              {position !== null && (
                <p className="text-sm text-muted-foreground">
                  {position === 1
                    ? "You're next — get ready!"
                    : `${position - 1} ${position - 1 === 1 ? "person" : "people"} ahead of you`}
                </p>
              )}
            </div>
          </div>
        )}

        {isServing && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Scissors className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary">Now Serving</p>
              <p className="text-sm text-muted-foreground">Please head to your seat</p>
            </div>
            {/* Fixed: relative parent needed for ping */}
            <span className="relative ml-auto flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Visit Complete</p>
              <p className="text-sm text-muted-foreground">Thanks for visiting! See you next time.</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">
                {status === "no_show" ? "Marked No-Show" : "Cancelled"}
              </p>
              <p className="text-sm text-muted-foreground">This ticket is no longer active.</p>
            </div>
          </div>
        )}
      </div>

      {/* Realtime note + manual refresh */}
      {(isWaiting || isServing) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Updates live &mdash; last refreshed {lastUpdated.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={fetchPosition}
            className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      )}

      {isWaiting && position !== null && position > 3 && (
        <p className="text-center text-xs text-muted-foreground">
          Feel free to wait nearby — we&apos;ll update this page in real-time.
        </p>
      )}
    </div>
  );
}
