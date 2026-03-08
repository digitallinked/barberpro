"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getStaffMembers, getStaffMember, getStaffStats } from "@/services/staff";

export function useStaffMembers() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff", tenantId],
    queryFn: () => getStaffMembers(supabase, tenantId),
  });
}

export function useStaffMember(id: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaffMember(supabase, id),
    enabled: !!id,
  });
}

export function useStaffStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-stats", tenantId],
    queryFn: () => getStaffStats(supabase, tenantId),
  });
}
