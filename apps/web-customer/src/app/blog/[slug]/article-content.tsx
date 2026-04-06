"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Twitter,
  Facebook,
  Link2,
  Check,
  Newspaper,
  ChevronRight,
  AlignLeft,
} from "lucide-react";

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

type TocItem = {
  id: string;
  text: string;
  level: number;
};

type Props = {
  post: BlogPost;
  postUrl: string;
  related: BlogPost[];
};

function extractToc(html: string): TocItem[] {
  const headings: TocItem[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  const idCounts: Record<string, number> = {};

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const raw = match[2].replace(/<[^>]+>/g, "").trim();
    const baseId = raw
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    const count = (idCounts[baseId] = (idCounts[baseId] ?? 0) + 1);
    const id = count > 1 ? `${baseId}-${count}` : baseId;
    headings.push({ id, text: raw, level });
  }
  return headings;
}

/** Inject IDs into heading tags for scroll targets. */
function injectHeadingIds(html: string): string {
  const idCounts: Record<string, number> = {};
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, inner) => {
    const raw = inner.replace(/<[^>]+>/g, "").trim();
    const baseId = raw
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    const count = (idCounts[baseId] = (idCounts[baseId] ?? 0) + 1);
    const id = count > 1 ? `${baseId}-${count}` : baseId;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

export function ArticleContent({ post, postUrl, related }: Props) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const toc = extractToc(post.content);
  const processedContent = injectHeadingIds(post.content);
  const hasToc = toc.length >= 2;

  // Reading progress
  useEffect(() => {
    function handleScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      setScrollProgress(Math.min(100, total > 0 ? (scrolled / total) * 100 : 0));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active TOC tracking
  useEffect(() => {
    if (!hasToc) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc, hasToc]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [postUrl]);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-[#d4af37] origin-left transition-transform"
        style={{ transform: `scaleX(${scrollProgress / 100})`, transformOrigin: "left" }}
      />

      <main className="flex-1 pb-20">
        {/* Cover image */}
        {post.cover_image_url && (
          <div className="relative h-64 overflow-hidden sm:h-80 lg:h-[420px]">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1013] via-[#0d1013]/40 to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-[#d4af37]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mt-6 flex gap-10">
            {/* Article */}
            <article ref={articleRef} className="min-w-0 flex-1">
              {/* Header */}
              <header className="mb-8">
                {post.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold capitalize text-[#d4af37] transition hover:bg-[#d4af37]/20"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="mt-4 text-lg leading-relaxed text-gray-400">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-white/5 pb-5 text-sm text-gray-500">
                  {post.author_name && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37]/20 text-xs font-bold text-[#d4af37]">
                        {post.author_name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-300">{post.author_name}</span>
                    </div>
                  )}
                  {post.published_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString("en-MY", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </span>
                  )}
                  {post.reading_time_minutes && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.reading_time_minutes} min read
                    </span>
                  )}
                </div>

                {/* Mobile TOC toggle */}
                {hasToc && (
                  <button
                    type="button"
                    onClick={() => setTocOpen((v) => !v)}
                    className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8 lg:hidden"
                  >
                    <span className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-[#d4af37]" />
                      Table of Contents
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-gray-500 transition-transform ${tocOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                )}

                {/* Mobile TOC dropdown */}
                {hasToc && tocOpen && (
                  <div className="mt-2 rounded-lg border border-white/10 bg-[#111518] p-4 lg:hidden">
                    <TocList items={toc} activeId={activeId} onSelect={() => setTocOpen(false)} />
                  </div>
                )}
              </header>

              {/* Article body */}
              <div
                className="prose prose-invert max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-24
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-gray-300 prose-p:leading-8 prose-p:mb-4
                  prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-code:text-[#d4af37] prose-code:bg-white/5 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
                  prose-pre:bg-[#111518] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                  prose-blockquote:border-l-[#d4af37] prose-blockquote:text-gray-400 prose-blockquote:not-italic
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:marker:text-[#d4af37]
                  prose-img:rounded-xl prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Tags footer */}
              {post.tags.length > 0 && (
                <div className="mt-12 border-t border-white/5 pt-8">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium capitalize text-gray-400 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/5 pt-8">
                <p className="text-sm font-semibold text-gray-400">Share this article:</p>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-[#1DA1F2]/10 px-4 py-2 text-sm font-semibold text-[#1DA1F2] transition hover:bg-[#1DA1F2]/20"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-[#4267B2]/10 px-4 py-2 text-sm font-semibold text-[#4267B2] transition hover:bg-[#4267B2]/20"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div className="mt-16">
                  <h2 className="mb-6 text-xl font-bold text-white">Related Articles</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((r) => (
                      <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111518] transition hover:border-[#d4af37]/30">
                          {r.cover_image_url ? (
                            <div className="aspect-[16/9] overflow-hidden">
                              <img
                                src={r.cover_image_url}
                                alt={r.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/9] items-center justify-center bg-[#1a1f25]">
                              <Newspaper className="h-8 w-8 text-white/10" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[#d4af37] transition-colors">
                              {r.title}
                            </h3>
                            {r.reading_time_minutes && (
                              <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                {r.reading_time_minutes} min read
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sticky sidebar TOC — desktop */}
            {hasToc && (
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-20">
                  <div className="rounded-xl border border-white/10 bg-[#111518] p-5">
                    <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                      <AlignLeft className="h-3.5 w-3.5 text-[#d4af37]" />
                      Contents
                    </p>
                    <TocList items={toc} activeId={activeId} />
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function TocList({
  items,
  activeId,
  onSelect,
}: {
  items: TocItem[];
  activeId: string;
  onSelect?: () => void;
}) {
  return (
    <nav>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
            <a
              href={`#${item.id}`}
              onClick={onSelect}
              className={`block rounded py-1 text-sm leading-snug transition-colors ${
                activeId === item.id
                  ? "font-semibold text-[#d4af37]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
