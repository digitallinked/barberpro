"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getCommissionSchemes, getStaffAssignments } from "@/services/commissions";

export function useCommissionSchemes() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["commission-schemes", tenantId],
    queryFn: () => getCommissionSchemes(supabase, tenantId),
  });
}

export function useStaffAssignments() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["staff-assignments", tenantId],
    queryFn: () => getStaffAssignments(supabase, tenantId),
  });
}
