import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BranchProvider } from "@/components/branch-context";
import { getCurrentTenant } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { resolveBranchBySlug } from "@/lib/branch-slug";
import { hasSupabaseEnv } from "@/lib/env";

const ALL_SLUG = "all";

type Props = {
  children: ReactNode;
  params: Promise<{ branchSlug: string }>;
};

export default async function BranchSlugLayout({ children, params }: Props) {
  const { branchSlug } = await params;

  if (!hasSupabaseEnv()) {
    return <BranchProvider value={null}>{children}</BranchProvider>;
  }

  const tenantCtx = await getCurrentTenant();
  if (!tenantCtx) redirect("/login");

  const isOwner = tenantCtx.userRole === "owner";

  if (branchSlug === ALL_SLUG) {
    if (!isOwner) {
      // Non-owners cannot access the "all branches" aggregate view
      const userBranch = tenantCtx.branches.find((b) => b.id === tenantCtx.branchId);
      const fallback = userBranch?.slug ?? tenantCtx.branches[0]?.slug;
      if (fallback) redirect(`/${fallback}/dashboard`);
      redirect("/branches");
    }
    // Owner: aggregate view — no specific branch context
    return <BranchProvider value={null}>{children}</BranchProvider>;
  }

  const supabase = await createClient();
  const branch = await resolveBranchBySlug(supabase, tenantCtx.tenantId, branchSlug);

  if (!branch) {
    // Slug not found — redirect to the user's default branch
    const defaultSlug = tenantCtx.branchSlug ?? tenantCtx.branches[0]?.slug;
    if (defaultSlug) redirect(`/${defaultSlug}/dashboard`);
    redirect("/branches");
  }

  if (!isOwner && branch.id !== tenantCtx.branchId) {
    // Staff can only access their own assigned branch
    const userBranch = tenantCtx.branches.find((b) => b.id === tenantCtx.branchId);
    const fallback = userBranch?.slug ?? tenantCtx.branches[0]?.slug ?? branchSlug;
    redirect(`/${fallback}/dashboard`);
  }

  return <BranchProvider value={branch}>{children}</BranchProvider>;
}
