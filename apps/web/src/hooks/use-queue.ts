"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getQueueTickets, getQueueStats, getQueueTicketsForBranch } from "@/services/queue";
import { getSeats } from "@/actions/seats";

export function useQueueTickets() {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["queue-tickets", tenantId, branchId],
    queryFn: () => getQueueTickets(supabase, tenantId, branchId!),
    enabled: !!branchId,
    refetchInterval: 10_000,
  });
}

export function useQueueStats() {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["queue-stats", tenantId, branchId],
    queryFn: () => getQueueStats(supabase, tenantId, branchId!),
    enabled: !!branchId,
    refetchInterval: 10_000,
  });
}

export function useSeats() {
  const { branchId } = useTenant();

  return useQuery({
    queryKey: ["branch-seats", branchId],
    queryFn: () => getSeats(branchId),
    enabled: !!branchId,
    refetchInterval: 15_000,
  });
}

export function useQueueBoard(branchId: string | null) {
  return useQuery({
    queryKey: ["queue-board", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/queue-board?branch=${encodeURIComponent(branchId!)}`);
      const json = (await res.json()) as {
        data?: Awaited<ReturnType<typeof getQueueTicketsForBranch>>["data"];
        branchName?: string | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load queue board");
      }

      return {
        data: json.data ?? [],
        branchName: json.branchName ?? null,
        error: null,
      };
    },
    enabled: !!branchId,
    refetchInterval: 5_000,
  });
}
