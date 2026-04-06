import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createAdminClient();

  // Use PostgreSQL full-text search via search_vector + plainto_tsquery for robustness
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select("id, title, slug, excerpt, tags, reading_time_minutes, published_at")
    .eq("status", "published")
    // Use textSearch for FTS
    .textSearch("search_vector", q, {
      type: "plain",
      config: "english",
    })
    .order("published_at", { ascending: false })
    .limit(8);

  // If FTS returns nothing, fall back to ILIKE on title
  let results = data ?? [];
  if (results.length === 0) {
    const { data: fallback } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("blog_posts" as any)
      .select("id, title, slug, excerpt, tags, reading_time_minutes, published_at")
      .eq("status", "published")
      .ilike("title", `%${q}%`)
      .order("published_at", { ascending: false })
      .limit(8);
    results = fallback ?? [];
  }

  return NextResponse.json({ results });
}
