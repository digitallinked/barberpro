"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getTenantImages } from "@/services/tenants";

export function useTenantImages() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["tenant-images", tenantId],
    queryFn: () => getTenantImages(supabase, tenantId),
  });
}
