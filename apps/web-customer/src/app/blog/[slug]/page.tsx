import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBlogLocale } from "@/lib/blog-locale";
import {
  resolveBlogPost,
  resolveBlogListItem,
  type BlogPostRow,
  type BlogListPost,
} from "@/lib/blog-resolve";
import { translations } from "@/lib/i18n/translations";
import { ArticleContent } from "./article-content";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string): Promise<BlogPostRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select(
      "id, title, slug, excerpt, content, title_ms, excerpt_ms, content_ms, cover_image_url, author_name, tags, reading_time_minutes, published_at"
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return data as BlogPostRow | null;
}

async function getRelatedPosts(
  post: BlogPostRow,
  locale: "ms" | "en"
): Promise<BlogListPost[]> {
  if (!post.tags.length) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select(
      "id, title, slug, excerpt, title_ms, excerpt_ms, cover_image_url, author_name, tags, reading_time_minutes, published_at, content, content_ms"
    )
    .eq("status", "published")
    .neq("id", post.id)
    .contains("tags", [post.tags[0]])
    .order("published_at", { ascending: false })
    .limit(3);
  const rows = (data ?? []) as BlogPostRow[];
  return rows.map((row) => resolveBlogListItem(row, locale));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getBlogLocale();
  const post = await getPost(slug);
  if (!post) {
    const b = translations[locale].blog;
    return { title: `${b.noPosts} — BarberPro` };
  }

  const resolved = resolveBlogPost(post, locale);
  const ogImage = resolved.cover_image_url
    ? [{ url: resolved.cover_image_url, width: 1200, height: 630, alt: resolved.title }]
    : [];

  return {
    title: `${resolved.title} — BarberPro Blog`,
    description:
      resolved.excerpt ?? `Read ${resolved.title} on the BarberPro Blog.`,
    openGraph: {
      title: resolved.title,
      description: resolved.excerpt ?? undefined,
      type: "article",
      url: `https://barberpro.my/blog/${resolved.slug}`,
      locale: locale === "ms" ? "ms_MY" : "en_MY",
      publishedTime: resolved.published_at ?? undefined,
      authors: resolved.author_name ? [resolved.author_name] : [],
      tags: resolved.tags,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: resolved.title,
      description: resolved.excerpt ?? undefined,
      images: resolved.cover_image_url ? [resolved.cover_image_url] : [],
    },
    alternates: { canonical: `https://barberpro.my/blog/${resolved.slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getBlogLocale();
  const postRow = await getPost(slug);
  if (!postRow) notFound();

  const post = resolveBlogPost(postRow, locale);
  const related = await getRelatedPosts(postRow, locale);
  const postUrl = `https://barberpro.my/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    author: post.author_name
      ? { "@type": "Person", name: post.author_name }
      : { "@type": "Organization", name: "BarberPro" },
    publisher: {
      "@type": "Organization",
      name: "BarberPro",
      logo: { "@type": "ImageObject", url: "https://barberpro.my/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    keywords: post.tags.join(", "),
    inLanguage: post.resolvedLocale === "ms" ? "ms-MY" : "en-MY",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1013]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <ArticleContent post={post} postUrl={postUrl} related={related} />
      <Footer />
    </div>
  );
}
