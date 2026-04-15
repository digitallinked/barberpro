"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getStaffAttendance, getAttendanceSummaries } from "@/services/attendance";

const ATTENDANCE_STALE = 5 * 60 * 1000; // 5 min

export function useStaffAttendance(dateFrom: string, dateTo: string, staffId?: string, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-attendance", tenantId, dateFrom, dateTo, staffId],
    queryFn: () => getStaffAttendance(supabase, tenantId, dateFrom, dateTo, staffId),
    enabled: enabled && !!dateFrom && !!dateTo,
    staleTime: ATTENDANCE_STALE,
  });
}

export function useAttendanceSummaries(dateFrom: string, dateTo: string, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["attendance-summaries", tenantId, dateFrom, dateTo],
    queryFn: () => getAttendanceSummaries(supabase, tenantId, dateFrom, dateTo),
    enabled: enabled && !!dateFrom && !!dateTo,
    staleTime: ATTENDANCE_STALE,
  });
}
