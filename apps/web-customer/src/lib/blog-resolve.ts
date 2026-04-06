import type { Language } from "@/lib/i18n/translations";

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  title_ms: string | null;
  excerpt_ms: string | null;
  content_ms: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  reading_time_minutes: number | null;
  published_at: string | null;
};

export type ResolvedBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  reading_time_minutes: number | null;
  published_at: string | null;
  /** Which language was used for title/excerpt/content (ms only if MS fields are filled). */
  resolvedLocale: Language;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingMinutes(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Pick BM copy when `lang === "ms"` and Malay fields exist; otherwise English. */
export function resolveBlogPost(row: BlogPostRow, lang: Language): ResolvedBlogPost {
  const hasMs =
    Boolean(row.title_ms?.trim()) &&
    Boolean(row.content_ms?.trim());

  if (lang === "ms" && hasMs) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title_ms!.trim(),
      excerpt: row.excerpt_ms?.trim() || row.excerpt,
      content: row.content_ms!.trim(),
      cover_image_url: row.cover_image_url,
      author_name: row.author_name,
      tags: row.tags,
      reading_time_minutes: estimateReadingMinutes(row.content_ms!.trim()),
      published_at: row.published_at,
      resolvedLocale: "ms",
    };
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: row.cover_image_url,
    author_name: row.author_name,
    tags: row.tags,
    reading_time_minutes: row.reading_time_minutes ?? estimateReadingMinutes(row.content),
    published_at: row.published_at,
    resolvedLocale: "en",
  };
}

export type BlogListPost = Omit<ResolvedBlogPost, "content">;

export function resolveBlogListItem(
  row: Pick<
    BlogPostRow,
    | "id"
    | "title"
    | "slug"
    | "excerpt"
    | "title_ms"
    | "excerpt_ms"
    | "cover_image_url"
    | "author_name"
    | "tags"
    | "reading_time_minutes"
    | "published_at"
    | "content"
    | "content_ms"
  >,
  lang: Language
): BlogListPost {
  const full = resolveBlogPost(row as BlogPostRow, lang);
  const { content: _c, ...rest } = full;
  return rest;
}

export function resolveSearchHit(row: BlogPostRow, lang: Language) {
  const list = resolveBlogListItem(row, lang);
  return {
    id: list.id,
    slug: list.slug,
    title: list.title,
    excerpt: list.excerpt,
    tags: list.tags,
    reading_time_minutes: list.reading_time_minutes,
    published_at: list.published_at,
  };
}
