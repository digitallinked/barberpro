import type { Metadata } from "next";

export const NOINDEX_FOLLOW: Metadata = {
  robots: { index: false, follow: true },
};
