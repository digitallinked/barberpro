"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Settings, Store } from "lucide-react";
import type { BranchTab } from "@/lib/permissions";

const TAB_ICONS: Record<string, React.ElementType> = {
  overview: Store,
  settings: Settings,
};

type Props = {
  tabs: BranchTab[];
  basePath: string;
};

export function BranchSlugLayoutTabs({ tabs, basePath }: Props) {
  const pathname = usePathname();

  const activeTab = (() => {
    const after = pathname.replace(basePath, "").replace(/^\//, "");
    if (!after) return "overview";
    return after.split("/")[0] || "overview";
  })();

  return (
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
  );
}
