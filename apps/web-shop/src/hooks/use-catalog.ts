"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getServices, getServiceCategories } from "@/services/catalog";

export function useServices() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["services", tenantId],
    queryFn: () => getServices(supabase, tenantId),
  });
}

export function useServiceCategories() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["service-categories", tenantId],
    queryFn: () => getServiceCategories(supabase, tenantId),
  });
}
