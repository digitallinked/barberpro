import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NOINDEX_FOLLOW } from "@/lib/seo-robots";

export const metadata: Metadata = NOINDEX_FOLLOW;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
