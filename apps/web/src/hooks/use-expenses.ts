"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getExpenses, getExpenseStats } from "@/services/expenses";

export function useExpenses() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["expenses", tenantId],
    queryFn: () => getExpenses(supabase, tenantId),
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
