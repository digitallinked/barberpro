"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getCommissionSchemes, getStaffAssignments } from "@/services/commissions";

const COMMISSION_STALE = 10 * 60 * 1000; // 10 min — schemes change infrequently

export function useCommissionSchemes() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["commission-schemes", tenantId],
    queryFn: () => getCommissionSchemes(supabase, tenantId),
    staleTime: COMMISSION_STALE,
  });
}

export function useStaffAssignments(enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-assignments", tenantId],
    queryFn: () => getStaffAssignments(supabase, tenantId),
    staleTime: COMMISSION_STALE,
    enabled,
  });
}
