"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getServices, getServiceCategories } from "@/services/catalog";

const CATALOG_STALE = 15 * 60 * 1000; // 15 min — service catalog changes rarely

export function useServices() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["services", tenantId],
    queryFn: () => getServices(supabase, tenantId),
    staleTime: CATALOG_STALE,
  });
}

export function useServiceCategories() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["service-categories", tenantId],
    queryFn: () => getServiceCategories(supabase, tenantId),
    staleTime: CATALOG_STALE,
  });
}
