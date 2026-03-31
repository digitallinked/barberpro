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
