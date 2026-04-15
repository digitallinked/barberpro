"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getStaffMembers, getStaffMember, getStaffStats } from "@/services/staff";

const STAFF_STALE = 10 * 60 * 1000; // 10 min — staff roster changes rarely mid-session

export function useStaffMembers(explicitBranchId?: string | null, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["staff", tenantId, branchId ?? "all"],
    queryFn: () => getStaffMembers(supabase, tenantId, branchId),
    staleTime: STAFF_STALE,
    enabled,
  });
}

export function useStaffMember(id: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaffMember(supabase, id),
    enabled: !!id,
    staleTime: STAFF_STALE,
  });
}

export function useStaffStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-stats", tenantId],
    queryFn: () => getStaffStats(supabase, tenantId),
    staleTime: 5 * 60 * 1000,
  });
}
