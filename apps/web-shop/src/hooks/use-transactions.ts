"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getTransactions, getDashboardStats, getDailyRevenue } from "@/services/transactions";
import type { Period } from "@/services/transactions";

export function useTransactions(limit?: number) {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["transactions", tenantId, branchId, limit],
    queryFn: () => getTransactions(supabase, tenantId, branchId ?? undefined, limit),
  });
}

export function useDashboardStats(period: Period = "today") {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["dashboard-stats", tenantId, branchId, period],
    queryFn: () => getDashboardStats(supabase, tenantId, branchId ?? undefined, period),
  });
}

export function useDailyRevenue(period: Period = "today") {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["daily-revenue", tenantId, branchId, period],
    queryFn: () => getDailyRevenue(supabase, tenantId, branchId ?? undefined, period),
  });
}
