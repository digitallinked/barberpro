"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveBranchId } from "./use-effective-branch";
import { getInventoryItems, getInventoryStats, getSuppliers } from "@/services/inventory";

const INVENTORY_STALE = 5 * 60 * 1000; // 5 min — stock levels can change via sales

export function useInventoryItems(explicitBranchId?: string | null, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["inventory", tenantId, branchId ?? "all"],
    queryFn: () => getInventoryItems(supabase, tenantId, branchId),
    staleTime: INVENTORY_STALE,
    enabled,
  });
}

export function useInventoryStats(explicitBranchId?: string | null, enabled = true) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const branchId = useEffectiveBranchId(explicitBranchId);

  return useQuery({
    queryKey: ["inventory-stats", tenantId, branchId ?? "all"],
    queryFn: () => getInventoryStats(supabase, tenantId, branchId),
    staleTime: INVENTORY_STALE,
    enabled,
  });
}

export function useSuppliers() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["suppliers", tenantId],
    queryFn: () => getSuppliers(supabase, tenantId),
    staleTime: 10 * 60 * 1000, // 10 min — supplier list rarely changes
  });
}
