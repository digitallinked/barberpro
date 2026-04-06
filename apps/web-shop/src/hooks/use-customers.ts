"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getCustomers, getCustomerStats } from "@/services/customers";

export function useCustomers() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customers", tenantId],
    queryFn: () => getCustomers(supabase, tenantId),
  });
}

export function useCustomerStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customer-stats", tenantId],
    queryFn: () => getCustomerStats(supabase, tenantId),
  });
}

export function useCustomerVisitStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["customer-visit-stats", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("customer_id, created_at")
        .eq("tenant_id", tenantId)
        .not("customer_id", "is", null);

      if (error) return { data: null, error: new Error(error.message) };

      const visitMap = new Map<string, { count: number; lastVisit: string }>();
      for (const row of data ?? []) {
        if (!row.customer_id) continue;
        const existing = visitMap.get(row.customer_id);
        if (!existing) {
          visitMap.set(row.customer_id, { count: 1, lastVisit: row.created_at });
        } else {
          existing.count += 1;
          if (row.created_at > existing.lastVisit) existing.lastVisit = row.created_at;
        }
      }
      return { data: visitMap, error: null };
    },
  });
}
