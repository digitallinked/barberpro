import type { MetadataRoute } from "next";

import { getMetadataBase } from "@/lib/env";

const PATHS = [
  "",
  "/about",
  "/contact",
  "/help",
  "/careers",
  "/terms",
  "/privacy",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getMetadataBase().origin;
  const now = new Date();

  return PATHS.map((path) => ({
    url: path === "" ? origin : `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.75,
  }));
}
