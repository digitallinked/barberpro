"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { getBranches, getBranch, getBranchBySlug, getBranchImages } from "@/services/branches";

const BRANCH_STALE = 10 * 60 * 1000; // 10 min — branches rarely change mid-session

export function useBranches() {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["branches", tenantId],
    queryFn: () => getBranches(supabase, tenantId),
    staleTime: BRANCH_STALE,
  });
}

export function useBranch(id: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["branch", id],
    queryFn: () => getBranch(supabase, id!),
    enabled: !!id,
    staleTime: BRANCH_STALE,
  });
}

export function useBranchBySlug(slug: string | undefined) {
  const supabase = useSupabase();
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["branch-by-slug", tenantId, slug],
    queryFn: () => getBranchBySlug(supabase, tenantId, slug!),
    enabled: !!slug,
    staleTime: BRANCH_STALE,
  });
}

export function useBranchImages(branchId: string | undefined) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["branch-images", branchId],
    queryFn: () => getBranchImages(supabase, branchId!),
    enabled: !!branchId,
    staleTime: 15 * 60 * 1000, // 15 min — images don't change often
  });
}
