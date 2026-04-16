import type { Metadata } from "next";

/** Auth, account, and transactional surfaces — not primary organic landing pages. */
export const NOINDEX_FOLLOW: Metadata = {
  robots: { index: false, follow: true },
};
