import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { BlogPostForm } from "../blog-post-form";
import { createPost } from "../actions";

export default async function NewBlogPostPage() {
  await requireAccess("/blog");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/blog"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        <PageHeader title="New Blog Post" description="Create a new post for the BarberPro blog" />
      </div>

      <BlogPostForm action={createPost as (formData: FormData) => void} />
    </div>
  );
}
