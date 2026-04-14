"use client";

import { usePathname } from "next/navigation";

/**
 * Returns a function that prefixes a page path with the current branch slug.
 * e.g. on /digital-linked/dashboard, branchHref("/queue") → "/digital-linked/queue"
 * On global pages (no branch prefix), returns the path as-is.
 *
 * Note: "settings" is intentionally NOT listed here so that
 * branchHref("/settings") → "/:branchSlug/settings" (branch settings).
 * Workspace pages (/workspace/*, /billing) are global.
 */
export function useBranchHref(): (page: string) => string {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0] ?? "";

  const GLOBAL_PAGES = new Set([
    "billing", "branches", "workspace", "profile",
    "queue-board", "login", "register",
  ]);

  const prefix = slug && !GLOBAL_PAGES.has(slug) ? `/${slug}` : "";

  return (page: string) => `${prefix}${page}`;
}
