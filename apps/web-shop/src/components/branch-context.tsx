"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BranchRow } from "@/lib/branch-slug";

const BranchCtx = createContext<BranchRow | null>(null);

export function BranchProvider({
  value,
  children,
}: {
  value: BranchRow | null;
  children: ReactNode;
}) {
  return <BranchCtx.Provider value={value}>{children}</BranchCtx.Provider>;
}

/**
 * Returns the active branch, or null in "all branches" mode.
 * Safe to call outside a BranchProvider (returns null).
 */
export function useMaybeBranchContext(): BranchRow | null {
  return useContext(BranchCtx);
}

/**
 * Returns the active branch, throwing if called in "all branches" mode
 * or outside a BranchProvider. Use in branch-specific sub-pages only.
 */
export function useBranchContext(): BranchRow {
  const ctx = useContext(BranchCtx);
  if (!ctx) throw new Error("useBranchContext must be used within BranchProvider with a specific branch");
  return ctx;
}
