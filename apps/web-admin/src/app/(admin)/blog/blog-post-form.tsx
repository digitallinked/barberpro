"use client";

import { RichTextEditor } from "@/components/rich-text-editor";

type BlogPostFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => any;
  defaultValues?: {
    id?: string;
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    cover_image_url?: string;
    status?: string;
  };
};

export function BlogPostForm({ action, defaultValues }: BlogPostFormProps) {
  const isEdit = Boolean(defaultValues?.id);

  return (
    <form action={action} className="space-y-6">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content col */}
        <div className="space-y-5 lg:col-span-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={defaultValues?.title}
              placeholder="Enter post title…"
              className="h-10 w-full rounded-md border border-border bg-input px-3 text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug <span className="text-xs text-muted-foreground">(auto-generated from title if empty)</span>
            </label>
            <div className="flex items-center rounded-md border border-border bg-input overflow-hidden">
              <span className="border-r border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">/blog/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={defaultValues?.slug}
                placeholder="my-post-slug"
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt <span className="text-xs text-muted-foreground">(optional summary)</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={defaultValues?.excerpt}
              placeholder="A short summary shown in previews and meta tags…"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Rich text content */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Content <span className="text-red-400">*</span>
            </label>
            <RichTextEditor
              name="content"
              defaultValue={defaultValues?.content}
            />
          </div>
        </div>

        {/* Sidebar col */}
        <div className="space-y-5">
          {/* Publish controls */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold">Publish</h3>

            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={defaultValues?.status ?? "draft"}
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isEdit ? "Update Post" : "Create Post"}
            </button>
          </div>

          {/* Cover image */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold">Cover Image</h3>
            <div className="space-y-1.5">
              <label htmlFor="cover_image_url" className="text-xs text-muted-foreground">Image URL</label>
              <input
                id="cover_image_url"
                name="cover_image_url"
                type="url"
                defaultValue={defaultValues?.cover_image_url}
                placeholder="https://…"
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
