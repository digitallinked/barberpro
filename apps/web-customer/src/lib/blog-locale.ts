import { cookies } from "next/headers";

import type { Language } from "@/lib/i18n/translations";

export const BLOG_LANG_COOKIE = "barberpro-lang";

/** Server-only: matches LanguageProvider + localStorage key for blog HTML + metadata. */
export async function getBlogLocale(): Promise<Language> {
  const jar = await cookies();
  const v = jar.get(BLOG_LANG_COOKIE)?.value;
  if (v === "en" || v === "ms") return v;
  return "ms";
}
