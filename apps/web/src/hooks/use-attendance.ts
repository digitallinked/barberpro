"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getStaffAttendance, getAttendanceSummaries } from "@/services/attendance";

export function useStaffAttendance(dateFrom: string, dateTo: string, staffId?: string) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-attendance", tenantId, dateFrom, dateTo, staffId],
    queryFn: () => getStaffAttendance(supabase, tenantId, dateFrom, dateTo, staffId),
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useAttendanceSummaries(dateFrom: string, dateTo: string) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["attendance-summaries", tenantId, dateFrom, dateTo],
    queryFn: () => getAttendanceSummaries(supabase, tenantId, dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
  });
}
