import type { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";

const STATIC_PATHS = [
  "",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/blog",
  "/shops",
  "/for-businesses",
  "/how-it-works",
  "/styles",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.85,
  }));

  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("slug, updated_at")
    .eq("status", "active")
    .in("subscription_status", ["active", "trialing"]);

  const shopEntries: MetadataRoute.Sitemap = (tenants ?? []).map((t) => ({
    url: `${origin}/shop/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published");

  const blogEntries: MetadataRoute.Sitemap = (posts ?? []).map((p) => {
    const updated = new Date(p.updated_at).getTime();
    const published = p.published_at ? new Date(p.published_at).getTime() : 0;
    const last = new Date(Math.max(updated, published || 0));
    return {
      url: `${origin}/blog/${p.slug}`,
      lastModified: last,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  return [...staticEntries, ...shopEntries, ...blogEntries];
}
