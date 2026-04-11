"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useTenant } from "@/components/tenant-provider";
import { canAccessPage, pageFromPathname } from "@/lib/permissions";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { userRole, branches } = useTenant();
  const pathname = usePathname();
  const router = useRouter();

  // Derive branch slug from URL for redirect fallback
  const segments = pathname.split("/").filter(Boolean);
  const firstSeg = segments[0] ?? "";
  const hasBranchPrefix =
    firstSeg === "all" || branches.some((b) => b.slug === firstSeg);
  const branchPrefix = hasBranchPrefix ? `/${firstSeg}` : "";

  useEffect(() => {
    const page = pageFromPathname(pathname);
    if (page && !canAccessPage(userRole, page)) {
      router.replace(`${branchPrefix}/dashboard`);
    }
  }, [pathname, userRole, router, branchPrefix]);

  const page = pageFromPathname(pathname);
  if (page && !canAccessPage(userRole, page)) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <p className="text-sm text-gray-400">Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
}
