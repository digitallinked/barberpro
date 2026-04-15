"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getQueueTickets, getQueueStats, getQueueTicketsForBranch } from "@/services/queue";
import { getSeats } from "@/actions/seats";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function useQueueTickets() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId();

  return useQuery({
    queryKey: ["queue-tickets", tenantId, branchId ?? "all"],
    queryFn: () => getQueueTickets(supabase, tenantId, branchId!),
    enabled: !!branchId,
    refetchInterval: 10_000,
  });
}

/**
 * @param poll - pass false on pages that don't need live queue counts (e.g. the main dashboard).
 *               The queue page and queue board always pass true (default).
 */
export function useQueueStats(poll = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId();

  return useQuery({
    queryKey: ["queue-stats", tenantId, branchId ?? "all"],
    queryFn: () => getQueueStats(supabase, tenantId, branchId!),
    enabled: !!branchId,
    refetchInterval: poll ? 10_000 : false,
    staleTime: poll ? 0 : 60_000,
  });
}

export function useSeats() {
  const branchId = useEffectiveBranchId();

  return useQuery({
    queryKey: ["branch-seats", branchId ?? "all"],
    queryFn: () => getSeats(branchId),
    enabled: !!branchId,
    refetchInterval: 15_000,
  });
}

export function useQueueBoard(branchId: string | null) {
  const queryClient = useQueryClient();

  // Supabase realtime: subscribe to queue_tickets and queue_ticket_seats changes
  // so the board updates instantly when a barber completes or assigns a seat.
  useEffect(() => {
    if (!branchId) return;

    const supabase = createBrowserSupabaseClient();
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["queue-board", branchId] });

    const channel = supabase
      .channel(`queue-board-${branchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_tickets", filter: `branch_id=eq.${branchId}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_ticket_seats" },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branch_seats", filter: `branch_id=eq.${branchId}` },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, queryClient]);

  return useQuery({
    queryKey: ["queue-board", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/queue-board?branch=${encodeURIComponent(branchId!)}`);
      const json = (await res.json()) as {
        data?: Awaited<ReturnType<typeof getQueueTicketsForBranch>>["data"];
        branchName?: string | null;
        seats?: { id: string; seat_number: number; label: string }[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load queue board");
      }

      return {
        data: json.data ?? [],
        branchName: json.branchName ?? null,
        seats: json.seats ?? [],
        error: null,
      };
    },
    enabled: !!branchId,
    refetchInterval: 10_000, // fallback poll — realtime handles instant updates
  });
}
