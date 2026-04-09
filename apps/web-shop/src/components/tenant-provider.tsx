"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TenantContext } from "@/lib/supabase/queries";

const STORAGE_KEY = "bp_active_branch";

type ActiveBranchState = {
  activeBranchId: string | null;
  activeBranchName: string | null;
  activeBranchSlug: string | null;
  isAllBranches: boolean;
  setActiveBranch: (branchId: string | null) => void;
};

type TenantWithBranch = TenantContext & ActiveBranchState;

const TenantCtx = createContext<TenantWithBranch | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContext;
  children: ReactNode;
}) {
  const isOwner = value.userRole === "owner";

  // Always start with null so server and client render identically (no hydration mismatch).
  // For owners we restore from localStorage after mount in a useEffect.
  // For non-owners we set to their assigned branch_id after mount as well.
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isOwner) {
      setSelectedBranchId(value.branchId);
      setHydrated(true);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && value.branches.some((b) => b.id === stored)) {
      setSelectedBranchId(stored);
    }
    setHydrated(true);
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOwner || !hydrated) return;
    if (selectedBranchId === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, selectedBranchId);
    }
  }, [isOwner, hydrated, selectedBranchId]);

  const setActiveBranch = useCallback(
    (branchId: string | null) => {
      if (!isOwner) return;
      setSelectedBranchId(branchId);
    },
    [isOwner],
  );

  const activeBranch = useMemo(() => {
    if (!isOwner) {
      const b = value.branches.find((br) => br.id === value.branchId) ?? null;
      return {
        id: value.branchId,
        name: b?.name ?? value.branchName,
        slug: b?.slug ?? value.branchSlug,
      };
    }
    if (selectedBranchId === null) return { id: null, name: null, slug: null };
    const b = value.branches.find((br) => br.id === selectedBranchId) ?? null;
    if (!b) return { id: null, name: null, slug: null };
    return { id: b.id, name: b.name, slug: b.slug };
  }, [isOwner, selectedBranchId, value.branchId, value.branchName, value.branchSlug, value.branches]);

  const merged = useMemo<TenantWithBranch>(
    () => ({
      ...value,
      activeBranchId: activeBranch.id,
      activeBranchName: activeBranch.name,
      activeBranchSlug: activeBranch.slug,
      isAllBranches: isOwner && activeBranch.id === null,
      setActiveBranch,
    }),
    [value, activeBranch, isOwner, setActiveBranch],
  );

  return <TenantCtx.Provider value={merged}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantWithBranch {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function useActiveBranch(): ActiveBranchState {
  const ctx = useTenant();
  return {
    activeBranchId: ctx.activeBranchId,
    activeBranchName: ctx.activeBranchName,
    activeBranchSlug: ctx.activeBranchSlug,
    isAllBranches: ctx.isAllBranches,
    setActiveBranch: ctx.setActiveBranch,
  };
}
