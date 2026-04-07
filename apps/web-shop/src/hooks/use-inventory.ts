"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getInventoryItems, getInventoryStats, getSuppliers } from "@/services/inventory";

export function useInventoryItems() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["inventory", tenantId],
    queryFn: () => getInventoryItems(supabase, tenantId),
  });
}

export function useInventoryStats() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["inventory-stats", tenantId],
    queryFn: () => getInventoryStats(supabase, tenantId),
  });
}

export function useSuppliers() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["suppliers", tenantId],
    queryFn: () => getSuppliers(supabase, tenantId),
  });
}
