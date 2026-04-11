"use client";

import { useMaybeBranchContext } from "@/components/branch-context";

/**
 * Returns the branch ID that data hooks should filter by.
 * - If a specific branch is active (URL-resolved) → returns that branch ID
 * - If "All Branches" mode (owner with /all slug) → returns undefined (no filter, shows all)
 * - Returns undefined when outside a BranchProvider (e.g. global pages like /billing)
 * - Accepts an explicit override for use in branch sub-pages (branches/[slug]/*)
 */
export function useEffectiveBranchId(explicitBranchId?: string | null): string | undefined {
  const branch = useMaybeBranchContext();
  if (explicitBranchId !== undefined) {
    return explicitBranchId ?? undefined;
  }
  return branch?.id ?? undefined;
}
