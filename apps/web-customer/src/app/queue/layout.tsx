import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NOINDEX_FOLLOW } from "@/lib/seo-robots";

export const metadata: Metadata = NOINDEX_FOLLOW;

type Props = { children: ReactNode };

export default function QueueLayout({ children }: Props) {
  return children;
}
