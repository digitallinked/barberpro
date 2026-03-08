"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getPayrollPeriods, getPayrollEntries } from "@/services/payroll";

export function usePayrollPeriods() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["payroll-periods", tenantId],
    queryFn: () => getPayrollPeriods(supabase, tenantId),
  });
}

export function usePayrollEntries(periodId: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["payroll-entries", periodId],
    queryFn: () => getPayrollEntries(supabase, periodId!),
    enabled: !!periodId,
  });
}
