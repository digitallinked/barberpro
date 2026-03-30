"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getPayrollPeriods, getPayrollEntries, getAllPayrollEntries } from "@/services/payroll";

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

export function useAllPayrollEntries(year?: number) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  const yearStart = year ? `${year}-01-01T00:00:00Z` : undefined;
  const yearEnd   = year ? `${year}-12-31T23:59:59Z` : undefined;

  return useQuery({
    queryKey: ["all-payroll-entries", tenantId, year],
    queryFn: () => getAllPayrollEntries(supabase, tenantId, yearStart, yearEnd),
  });
}
