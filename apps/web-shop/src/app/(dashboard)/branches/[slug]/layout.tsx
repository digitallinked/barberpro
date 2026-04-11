import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Settings,
  Store,
} from "lucide-react";
import { type ReactNode } from "react";

import { BranchProvider } from "@/components/branch-context";
import { getCurrentTenant } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { resolveBranchBySlug } from "@/lib/branch-slug";
import { getBranchTabs } from "@/lib/permissions";
import { shopMediaObjectPublicUrl } from "@barberpro/db/shop-media";
import { hasSupabaseEnv } from "@/lib/env";
import { BranchSlugLayoutTabs } from "./layout-tabs";

const TAB_ICONS: Record<string, React.ElementType> = {
  overview: Store,
  settings: Settings,
};

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

  const tabs = getBranchTabs(tenantCtx.userRole);
  const basePath = `/branches/${slug}`;
  const logoUrl = branch.logo_url;

  return (
    <BranchProvider value={branch}>
      <div className="space-y-0">
        <Link href="/branches" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>

        <div className="rounded-t-xl border border-white/5 bg-[#1a1a1a] px-6 pt-6 pb-0">
          <div className="flex items-center gap-4 pb-5">
            {logoUrl ? (
              <img src={shopMediaObjectPublicUrl(logoUrl)} alt={branch.name} className="h-12 w-12 rounded-xl border border-white/10 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                <Store className="h-6 w-6 text-[#D4AF37]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{branch.name}</h1>
                {branch.is_hq && (
                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">HQ</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${branch.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {branch.is_active ? "Open" : "Closed"}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-gray-500">{branch.code}</p>
            </div>
          </div>

          {/* Tab navigation is client-side for active-state detection */}
          <BranchSlugLayoutTabs tabs={tabs} basePath={basePath} tabIcons={TAB_ICONS} />
        </div>

        <div className="rounded-b-xl border border-t-0 border-white/5 bg-[#1a1a1a] p-6">
          {children}
        </div>
      </div>
    </BranchProvider>
  );
}
