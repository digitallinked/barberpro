"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getAppointments } from "@/services/appointments";

export function useAppointments() {
  const supabase = useSupabase();
  const { tenantId, branchId } = useTenant();

  return useQuery({
    queryKey: ["appointments", tenantId, branchId],
    queryFn: () => getAppointments(supabase, tenantId, branchId ?? undefined),
  });
}
