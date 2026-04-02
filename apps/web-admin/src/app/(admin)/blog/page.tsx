import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-500/15 text-green-400",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-yellow-500/15 text-yellow-500",
};

export default async function BlogPage({ searchParams }: PageProps) {
  await requireAccess("/blog");
  const { status: statusFilter } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, status, author_name, published_at, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  const posts = (data ?? []) as BlogPost[];

  const STATUSES = ["published", "draft", "archived"];
  const counts = {
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    archived: posts.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Blog"
        description="Create and manage platform blog posts"
      >
        <Link
          href="/blog/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          Could not load posts. Run migration 20260402140000 to create the blog_posts table.
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !statusFilter
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          All ({posts.length})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/blog?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s} ({counts[s as keyof typeof counts] ?? 0})
          </Link>
        ))}
      </div>

      {/* Posts table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/blog/${post.id}`}
                    className="font-medium hover:text-primary transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                  <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[post.status] ?? ""}`}>
                    {post.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  /{post.slug} · by {post.author_name ?? "Unknown"}
                  {post.published_at && (
                    <> · Published {new Date(post.published_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">
                {new Date(post.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        {posts.length === 0 && !error && (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            description="Create your first blog post to get started"
          >
            <Link
              href="/blog/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
