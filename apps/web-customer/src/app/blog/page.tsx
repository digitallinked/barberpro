import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Clock, Tag, ArrowRight, Rss } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBlogLocale } from "@/lib/blog-locale";
import {
  resolveBlogListItem,
  type BlogPostRow,
  type BlogListPost,
} from "@/lib/blog-resolve";
import { translations } from "@/lib/i18n/translations";
import { BlogSearch } from "./blog-search";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getBlogLocale();
  const b = translations[locale].blog;
  return {
    title: b.metaTitle,
    description: b.metaDesc,
    openGraph: {
      title: b.metaTitle,
      description: b.metaDesc,
      type: "website",
      url: "https://barberpro.my/blog",
      locale: locale === "ms" ? "ms_MY" : "en_MY",
    },
    alternates: { canonical: "https://barberpro.my/blog" },
  };
}

/** Escape `%` / `_` for PostgREST `ilike`; strip chars that break `or=(...)` parsing. */
function sanitizeSearchPattern(q: string): string {
  return q
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/[(),]/g, "");
}

type PageProps = {
  searchParams: Promise<{ tag?: string; q?: string }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const { tag: tagFilter, q } = await searchParams;
  const locale = await getBlogLocale();
  const b = translations[locale].blog;
  const dateLocale = locale === "ms" ? "ms-MY" : "en-MY";

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, title_ms, excerpt_ms, cover_image_url, author_name, tags, reading_time_minutes, published_at, content, content_ms"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (tagFilter) {
    query = query.contains("tags", [tagFilter]);
  }
  if (q) {
    const pattern = sanitizeSearchPattern(q);
    if (pattern.length > 0) {
      query = query.or(
        `title.ilike.%${pattern}%,title_ms.ilike.%${pattern}%`
      );
    }
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as BlogPostRow[];
  const posts = rows.map((row) => resolveBlogListItem(row, locale));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allPostsForTags } = await (supabase as any)
    .from("blog_posts")
    .select("tags")
    .eq("status", "published");

  const allTags = [
    ...new Set(
      ((allPostsForTags ?? []) as { tags: string[] }[]).flatMap((p) => p.tags ?? [])
    ),
  ].sort();

  const isFiltered = Boolean(tagFilter || q);
  const featuredPost = !isFiltered ? posts[0] : undefined;
  const gridPosts = !isFiltered ? posts.slice(1) : posts;

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1013]">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-[#111518] to-[#0d1013] px-4 pb-12 pt-16 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5">
              <Rss className="h-3.5 w-3.5 text-[#d4af37]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                {b.badge}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {b.heroTitle}{" "}
              <span className="text-[#d4af37]">{b.heroHighlight}</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400">{b.heroDesc}</p>

            <div className="mx-auto mt-8 max-w-lg">
              <BlogSearch initialQuery={q} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <Link
                href="/blog"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  !tagFilter
                    ? "bg-[#d4af37] text-black"
                    : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Tag className="h-3 w-3" />
                {b.allPosts}
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    tagFilter === tag
                      ? "bg-[#d4af37] text-black"
                      : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <EmptyBlog hasFilter={isFiltered} b={b} />
          ) : (
            <>
              {featuredPost && (
                <FeaturedPostCard post={featuredPost} b={b} dateLocale={dateLocale} />
              )}

              {gridPosts.length > 0 && (
                <div
                  className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${featuredPost ? "mt-10" : ""}`}
                >
                  {gridPosts.map((post) => (
                    <PostCard key={post.id} post={post} b={b} dateLocale={dateLocale} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeaturedPostCard({
  post,
  b,
  dateLocale,
}: {
  post: BlogListPost;
  b: (typeof translations)["ms"]["blog"];
  dateLocale: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111518] transition-all duration-300 hover:border-[#d4af37]/30 hover:shadow-2xl hover:shadow-[#d4af37]/5 lg:grid lg:grid-cols-2">
        <div className="aspect-[16/9] overflow-hidden bg-[#1a1f25] lg:aspect-auto">
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center">
              <Newspaper className="h-16 w-16 text-white/10" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-8">
          <div className="mb-3 inline-flex w-fit items-center rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            {b.featured}
          </div>

          {post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs capitalize text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold text-white transition-colors group-hover:text-[#d4af37] lg:text-3xl">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-3 text-base leading-relaxed text-gray-400 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <PostMeta post={post} b={b} dateLocale={dateLocale} className="mt-6" />

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#d4af37]">
            {b.readMore}{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function PostCard({
  post,
  b,
  dateLocale,
}: {
  post: BlogListPost;
  b: (typeof translations)["ms"]["blog"];
  dateLocale: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111518] transition-all duration-300 hover:border-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/5">
        <div className="aspect-[16/9] overflow-hidden bg-[#1a1f25]">
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Newspaper className="h-10 w-10 text-white/10" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          {post.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-[#d4af37]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="text-base font-bold text-white transition-colors group-hover:text-[#d4af37] line-clamp-2">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          <PostMeta post={post} b={b} dateLocale={dateLocale} className="mt-4" />
        </div>
      </article>
    </Link>
  );
}

function PostMeta({
  post,
  b,
  dateLocale,
  className,
}: {
  post: BlogListPost;
  b: (typeof translations)["ms"]["blog"];
  dateLocale: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs text-gray-600 ${className ?? ""}`}>
      {post.author_name && (
        <span className="font-medium text-gray-500">{post.author_name}</span>
      )}
      {post.published_at && (
        <>
          {post.author_name && <span>·</span>}
          <time dateTime={post.published_at}>
            {new Date(post.published_at).toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </>
      )}
      {post.reading_time_minutes != null && post.reading_time_minutes > 0 && (
        <>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.reading_time_minutes} {b.minRead}
          </span>
        </>
      )}
    </div>
  );
}

function EmptyBlog({
  hasFilter,
  b,
}: {
  hasFilter: boolean;
  b: (typeof translations)["ms"]["blog"];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <Newspaper className="h-9 w-9 text-white/20" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-white">
        {hasFilter ? b.noResults : b.noPosts}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {hasFilter ? b.noResultsDesc : b.noPostsDesc}
      </p>
      {hasFilter && (
        <Link
          href="/blog"
          className="mt-6 rounded-full bg-[#d4af37]/10 px-5 py-2 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20"
        >
          {b.browseAll}
        </Link>
      )}
    </div>
  );
}
