"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BranchRow } from "@/lib/branch-slug";

const BranchCtx = createContext<BranchRow | null>(null);

export function BranchProvider({
  value,
  children,
}: {
  value: BranchRow;
  children: ReactNode;
}) {
  return <BranchCtx.Provider value={value}>{children}</BranchCtx.Provider>;
}

export function useBranchContext(): BranchRow {
  const ctx = useContext(BranchCtx);
  if (!ctx) throw new Error("useBranchContext must be used within BranchProvider");
  return ctx;
}
