"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getTransactions, getDashboardStats, getDailyRevenue } from "@/services/transactions";
import type { Period } from "@/services/transactions";

export function useTransactions(limit?: number, explicitBranchId?: string | null) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["transactions", tenantId, branchId ?? "all", limit],
    queryFn: () => getTransactions(supabase, tenantId, branchId, limit),
    staleTime: 2 * 60 * 1000, // 2 min — transactions are live operational data
  });
}

export function useDashboardStats(period: Period = "today", explicitBranchId?: string | null) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["dashboard-stats", tenantId, branchId ?? "all", period],
    queryFn: () => getDashboardStats(supabase, tenantId, branchId, period),
    staleTime: 2 * 60 * 1000, // 2 min — stats should stay fairly fresh
  });
}

export function useDailyRevenue(period: Period = "today", explicitBranchId?: string | null) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["daily-revenue", tenantId, branchId ?? "all", period],
    queryFn: () => getDailyRevenue(supabase, tenantId, branchId, period),
    staleTime: 2 * 60 * 1000,
  });
}
