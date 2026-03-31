"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getTenantProfile } from "@/services/tenants";

export function useTenantProfile() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["tenant-profile", tenantId],
    queryFn: () => getTenantProfile(supabase, tenantId),
  });
}
