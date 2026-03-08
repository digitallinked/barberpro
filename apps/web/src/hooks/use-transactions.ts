"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getTransactions, getDashboardStats } from "@/services/transactions";

export function useTransactions(limit?: number) {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["transactions", tenantId, branchId, limit],
    queryFn: () => getTransactions(supabase, tenantId, branchId ?? undefined, limit),
  });
}

export function useDashboardStats() {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["dashboard-stats", tenantId, branchId],
    queryFn: () => getDashboardStats(supabase, tenantId, branchId ?? undefined),
  });
}
