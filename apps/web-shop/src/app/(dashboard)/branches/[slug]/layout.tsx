import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";

import { BranchProvider } from "@/components/branch-context";
import { getCurrentTenant } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { resolveBranchBySlug } from "@/lib/branch-slug";
import { hasSupabaseEnv } from "@/lib/env";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function BranchSlugLayout({ children, params }: Props) {
  const { slug } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-4">
        <Link href="/branches" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>
        <div>{children}</div>
      </div>
    );
  }

  const tenantCtx = await getCurrentTenant();
  if (!tenantCtx) redirect("/login");

  const supabase = await createClient();
  const branch = await resolveBranchBySlug(supabase, tenantCtx.tenantId, slug);

  if (!branch) {
    return (
      <div className="space-y-4">
        <Link href="/branches" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
          <p>Branch not found.</p>
        </div>
      </div>
    );
  }

  return (
    <BranchProvider value={branch}>
      <div className="space-y-4">
        <Link href="/branches" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#1a1a1a]">
          {children}
        </div>
      </div>
    </BranchProvider>
  );
}
