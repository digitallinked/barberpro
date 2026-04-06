import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogPostForm } from "../blog-post-form";
import { updatePost, deletePost } from "../actions";

type PageProps = { params: Promise<{ id: string }> };

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-500/15 text-green-400",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-yellow-500/15 text-yellow-500",
};

export default async function EditBlogPostPage({ params }: PageProps) {
  await requireAccess("/blog");
  const { id } = await params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  type PostRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image_url: string | null;
    status: string;
    author_name: string | null;
    tags: string[] | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const post = data as PostRow;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/blog"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageHeader title="Edit Post" description={`Last updated: ${new Date(post.updated_at).toLocaleString()}`} />
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[post.status] ?? ""}`}>
                {post.status}
              </span>
              {post.author_name && (
                <span className="text-xs text-muted-foreground">by {post.author_name}</span>
              )}
              {post.published_at && (
                <span className="text-xs text-muted-foreground">
                  · Published {new Date(post.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <form action={deletePost as (formData: FormData) => void}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              onClick={(e) => {
                if (!confirm("Delete this post? This cannot be undone.")) e.preventDefault();
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </form>
        </div>
      </div>

      <BlogPostForm
        action={updatePost as (formData: FormData) => void}
        defaultValues={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          cover_image_url: post.cover_image_url ?? "",
          status: post.status,
          tags: post.tags ?? [],
        }}
      />
    </div>
  );
}
