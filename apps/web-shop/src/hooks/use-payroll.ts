"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getPayrollPeriods, getPayrollEntries, getAllPayrollEntries } from "@/services/payroll";
import { calculateStaffCommission, getAttendanceSummaryForPeriod } from "@/lib/payroll-calculator";

const PAYROLL_STALE = 5 * 60 * 1000; // 5 min

export function usePayrollPeriods() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["payroll-periods", tenantId],
    queryFn: () => getPayrollPeriods(supabase, tenantId),
    staleTime: PAYROLL_STALE,
  });
}

export function usePayrollEntries(periodId: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["payroll-entries", periodId],
    queryFn: () => getPayrollEntries(supabase, periodId!),
    enabled: !!periodId,
    staleTime: PAYROLL_STALE,
  });
}

export function useAllPayrollEntries(year?: number, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  const yearStart = year ? `${year}-01-01T00:00:00Z` : undefined;
  const yearEnd   = year ? `${year}-12-31T23:59:59Z` : undefined;

  return useQuery({
    queryKey: ["all-payroll-entries", tenantId, year],
    queryFn: () => getAllPayrollEntries(supabase, tenantId, yearStart, yearEnd),
    staleTime: PAYROLL_STALE,
    enabled,
  });
}

export function useStaffCommission(
  staffId: string | null,
  periodStart: string | null,
  periodEnd: string | null
) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-commission", tenantId, staffId, periodStart, periodEnd],
    queryFn: () =>
      calculateStaffCommission(supabase, tenantId, staffId!, periodStart!, periodEnd!),
    enabled: !!staffId && !!periodStart && !!periodEnd,
    staleTime: PAYROLL_STALE,
  });
}

export function useStaffAttendanceSummary(
  staffId: string | null,
  periodStart: string | null,
  periodEnd: string | null
) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-attendance-summary", tenantId, staffId, periodStart, periodEnd],
    queryFn: () =>
      getAttendanceSummaryForPeriod(supabase, tenantId, staffId!, periodStart!, periodEnd!),
    enabled: !!staffId && !!periodStart && !!periodEnd,
    staleTime: PAYROLL_STALE,
  });
}
