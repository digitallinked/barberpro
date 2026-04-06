import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArticleContent } from "./article-content";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[];
  reading_time_minutes: number | null;
  published_at: string | null;
};

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select("id, title, slug, excerpt, content, cover_image_url, author_name, tags, reading_time_minutes, published_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return data as BlogPost | null;
}

async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  if (!post.tags.length) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("blog_posts" as any)
    .select("id, title, slug, excerpt, cover_image_url, author_name, tags, reading_time_minutes, published_at")
    .eq("status", "published")
    .neq("id", post.id)
    .contains("tags", [post.tags[0]])
    .order("published_at", { ascending: false })
    .limit(3);
  return ((data ?? []) as unknown) as BlogPost[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found — BarberPro Blog" };

  const ogImage = post.cover_image_url
    ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }]
    : [];

  return {
    title: `${post.title} — BarberPro Blog`,
    description: post.excerpt ?? `Read ${post.title} on the BarberPro Blog.`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      url: `https://barberpro.my/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : [],
      tags: post.tags,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
    alternates: { canonical: `https://barberpro.my/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
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
