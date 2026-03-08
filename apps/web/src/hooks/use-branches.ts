"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getBranches, getBranch } from "@/services/branches";

export function useBranches() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["branches", tenantId],
    queryFn: () => getBranches(supabase, tenantId),
  });
}

export function useBranch(id: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["branch", id],
    queryFn: () => getBranch(supabase, id!),
    enabled: !!id,
  });
}
