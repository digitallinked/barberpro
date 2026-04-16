import type { MetadataRoute } from "next";

import { getMetadataBase } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = getMetadataBase().origin;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
