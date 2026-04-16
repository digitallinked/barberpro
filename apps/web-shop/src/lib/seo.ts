import type { Metadata } from "next";

import { APP_NAME } from "@/constants/brand";
import { getMetadataBase } from "@/lib/env";

/** Canonical + Open Graph for public marketing pages on `shop.*`. */
export function marketingPageMetadata(
  path: string,
  title: string,
  description: string
): Metadata {
  const origin = getMetadataBase().origin;
  const url =
    path === "" || path === "/"
      ? origin
      : `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      locale: "en_MY",
      siteName: APP_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
