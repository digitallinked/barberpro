import { type ReactNode } from "react";

import { BranchProvider } from "@/components/branch-context";
import { TenantProvider } from "@/components/tenant-provider";
import { resolveBranchBySlug } from "@/lib/branch-slug";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/supabase/queries";

type BranchLayoutProps = {
  children: ReactNode;
  params: Promise<{ branchSlug: string }>;
};

/**
 * Re-provides TenantContext and BranchContext scoped to the branch in the URL.
 *
 * The parent (dashboard)/layout.tsx resolves the tenant using the user's default
 * branch; this layout overrides both contexts so all child pages — including
 * hooks like useQueueTickets (which reads BranchProvider via useEffectiveBranchId)
 * — operate on the branch the user is actually visiting.
 */
export default async function BranchLayout({ children, params }: BranchLayoutProps) {
  const { branchSlug } = await params;
  const tenantCtx = await getCurrentTenant(branchSlug);

  if (!tenantCtx) {
    // Parent layout already handles auth redirect; just render children
    return <>{children}</>;
  }

  // Fetch the full BranchRow so BranchProvider (used by useEffectiveBranchId
  // → useQueueTickets and other data hooks) has all required fields.
  const supabase = await createClient();
  const branchRow = await resolveBranchBySlug(supabase, tenantCtx.tenantId, branchSlug);

  return (
    <TenantProvider value={tenantCtx}>
      <BranchProvider value={branchRow}>{children}</BranchProvider>
    </TenantProvider>
  );
}
