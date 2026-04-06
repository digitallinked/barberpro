import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSearchHit, type BlogPostRow } from "@/lib/blog-resolve";
import type { Language } from "@/lib/i18n/translations";

export const runtime = "nodejs";

function parseLang(value: string | null | undefined): Language {
  if (value === "en" || value === "ms") return value;
  return "ms";
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const paramLang = request.nextUrl.searchParams.get("lang");
  const jar = await cookies();
  const cookieLang = jar.get("barberpro-lang")?.value;
  const lang = parseLang(paramLang ?? cookieLang);

  const supabase = createAdminClient();

  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select(
      "id, title, slug, excerpt, title_ms, excerpt_ms, content, content_ms, tags, reading_time_minutes, published_at"
    )
    .eq("status", "published")
    .textSearch("search_vector", q, {
      type: "plain",
      config: "english",
    })
    .order("published_at", { ascending: false })
    .limit(8);

  let rows = (data ?? []) as BlogPostRow[];

  if (rows.length === 0) {
    const esc = q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/[(),]/g, "");
    if (esc.length > 0) {
      const { data: fallback } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("blog_posts" as any)
        .select(
          "id, title, slug, excerpt, title_ms, excerpt_ms, content, content_ms, tags, reading_time_minutes, published_at"
        )
        .eq("status", "published")
        .or(`title.ilike.%${esc}%,title_ms.ilike.%${esc}%`)
        .order("published_at", { ascending: false })
        .limit(8);
      rows = (fallback ?? []) as BlogPostRow[];
    }
  }

  const results = rows.map((row) => resolveSearchHit(row, lang));
  return NextResponse.json({ results });
}
