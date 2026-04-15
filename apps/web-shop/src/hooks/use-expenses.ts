"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getExpenses, getExpenseStats } from "@/services/expenses";

const EXPENSE_STALE = 5 * 60 * 1000; // 5 min

export function useExpenses(explicitBranchId?: string | null, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["expenses", tenantId, branchId ?? "all"],
    queryFn: () => getExpenses(supabase, tenantId, branchId),
    staleTime: EXPENSE_STALE,
    enabled,
  });
}

export function useExpenseStats(enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["expense-stats", tenantId],
    queryFn: () => getExpenseStats(supabase, tenantId),
    staleTime: EXPENSE_STALE,
    enabled,
  });
}
