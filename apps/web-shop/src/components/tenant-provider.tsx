"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TenantContext } from "@/lib/supabase/queries";

const TenantCtx = createContext<TenantContext | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContext;
  children: ReactNode;
}) {
  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
