"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/components/tenant-provider";

/**
 * Redirect stub for old flat routes (e.g. /queue → /digital-linked/queue).
 * Reads the tenant's default branch from context and redirects.
 */
export function BranchRedirect({ page, subPath }: { page: string; subPath?: string }) {
  const router = useRouter();
  const { branches } = useTenant();

  useEffect(() => {
    const defaultBranch = branches.find((b) => b.is_hq) ?? branches[0];
    if (defaultBranch) {
      const target = subPath
        ? `/${defaultBranch.slug}/${page}/${subPath}`
        : `/${defaultBranch.slug}/${page}`;
      router.replace(target);
    }
  }, [router, branches, page, subPath]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
    </div>
  );
}
