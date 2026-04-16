import { env } from "@/lib/env";

/** Production origin without trailing slash (canonicals, JSON-LD, sitemaps). */
export function getSiteOrigin(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}
