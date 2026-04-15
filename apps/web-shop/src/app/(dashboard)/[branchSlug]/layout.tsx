import { type ReactNode } from "react";

import { TenantProvider } from "@/components/tenant-provider";
import { getCurrentTenant } from "@/lib/supabase/queries";

type BranchLayoutProps = {
  children: ReactNode;
  params: Promise<{ branchSlug: string }>;
};

/**
 * Re-provides TenantContext scoped to the branch in the URL.
 * The parent (dashboard)/layout.tsx resolves the tenant using the user's
 * default branch; this layout overrides that with the correct branch for
 * whichever /[branchSlug]/* page the user is actually visiting.
 */
export default async function BranchLayout({ children, params }: BranchLayoutProps) {
  const { branchSlug } = await params;
  const tenantCtx = await getCurrentTenant(branchSlug);

  if (!tenantCtx) {
    // Parent layout already handles auth redirect; just render children
    return <>{children}</>;
  }

  return <TenantProvider value={tenantCtx}>{children}</TenantProvider>;
}
