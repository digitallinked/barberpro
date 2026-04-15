"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getCustomers, getCustomerStats } from "@/services/customers";

const CUSTOMER_STALE = 5 * 60 * 1000; // 5 min

export function useCustomers(explicitBranchId?: string | null) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["customers", tenantId, branchId ?? "all"],
    queryFn: () => getCustomers(supabase, tenantId, branchId),
    staleTime: CUSTOMER_STALE,
  });
}

export function useCustomerStats(enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customer-stats", tenantId],
    queryFn: () => getCustomerStats(supabase, tenantId),
    staleTime: CUSTOMER_STALE,
    enabled,
  });
}

export function useCustomerVisitStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customer-visit-stats", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("report_customer_visits", {
        p_tenant_id: tenantId,
      });

      if (error) return { data: null, error: new Error(error.message) };

      const visitMap = new Map<string, { count: number; lastVisit: string }>();
      for (const row of data ?? []) {
        visitMap.set(row.customer_id as string, {
          count: Number(row.visit_count ?? 0),
          lastVisit: row.last_visit as string,
        });
      }
      return { data: visitMap, error: null };
    },
    staleTime: CUSTOMER_STALE,
  });
}
