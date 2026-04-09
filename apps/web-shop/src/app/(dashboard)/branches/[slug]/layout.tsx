"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Settings,
  Store,
} from "lucide-react";
import { type ReactNode } from "react";

import { BranchProvider } from "@/components/branch-context";
import { useTenant } from "@/components/tenant-provider";
import { useBranchBySlug } from "@/hooks";
import { getBranchTabs } from "@/lib/permissions";
import { shopMediaObjectPublicUrl } from "@barberpro/db/shop-media";

const TAB_ICONS: Record<string, React.ElementType> = {
  overview: Store,
  settings: Settings,
};

export default function BranchSlugLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const pathname = usePathname();
  const { userRole } = useTenant();

  const { data: branchResult, isLoading, error } = useBranchBySlug(slug);
  const branch = branchResult?.data ?? null;

  const tabs = getBranchTabs(userRole);
  const basePath = `/branches/${slug}`;

  const activeTab = (() => {
    const after = pathname.replace(basePath, "").replace(/^\//, "");
    if (!after) return "overview";
    return after.split("/")[0] || "overview";
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="text-sm text-gray-400">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (error || !branch) {
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

  const logoUrl = branch.logo_url;

  return (
    <BranchProvider value={branch}>
      <div className="space-y-0">
        {/* Back link */}
        <Link href="/branches" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>

        {/* Branch Header */}
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

          {/* Tab Navigation */}
          <div className="-mb-px flex gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const href = tab.key === "overview" ? basePath : `${basePath}/${tab.key}`;
              const Icon = TAB_ICONS[tab.key] ?? ClipboardList;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-[#D4AF37] text-[#D4AF37]"
                      : "border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.labelKey}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-b-xl border border-t-0 border-white/5 bg-[#1a1a1a] p-6">
          {children}
        </div>
      </div>
    </BranchProvider>
  );
}
