"use client";

import { useActiveBranch } from "@/components/tenant-provider";

/**
 * Returns the branch ID that data hooks should filter by.
 * - If a branch is actively selected → returns that branch ID
 * - If "All Branches" mode (owner) → returns undefined (no filter)
 * - Accepts an explicit override for use in branch sub-pages
 */
export function useEffectiveBranchId(explicitBranchId?: string | null): string | undefined {
  const { activeBranchId } = useActiveBranch();
  if (explicitBranchId !== undefined) {
    return explicitBranchId ?? undefined;
  }
  return activeBranchId ?? undefined;
}
