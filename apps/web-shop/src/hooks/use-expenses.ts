"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getExpenses, getExpenseStats } from "@/services/expenses";

export function useExpenses(explicitBranchId?: string | null) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["expenses", tenantId, branchId ?? "all"],
    queryFn: () => getExpenses(supabase, tenantId, branchId),
  });
}

export function useExpenseStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["expense-stats", tenantId],
    queryFn: () => getExpenseStats(supabase, tenantId),
  });
}
