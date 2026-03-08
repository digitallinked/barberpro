"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getQueueTickets, getQueueStats, getQueueTicketsForBranch } from "@/services/queue";

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

export function useQueueBoard(branchId: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["queue-board", branchId],
    queryFn: async () => {
      const result = await getQueueTicketsForBranch(supabase, branchId!);
      if (result.error) throw result.error;
      return result;
    },
    enabled: !!branchId,
    refetchInterval: 5_000,
  });
}
