"use client";

import { useState } from "react";
import { X, ImageIcon } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { MediaLibrary, type MediaFile } from "@/components/media-library";

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
    tags?: string[];
  };
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 100);
}

export function BlogPostForm({ action, defaultValues }: BlogPostFormProps) {
  const isEdit = Boolean(defaultValues?.id);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(defaultValues?.slug));
  const [tags, setTags] = useState((defaultValues?.tags ?? []).join(", "));
  const [coverUrl, setCoverUrl] = useState(defaultValues?.cover_image_url ?? "");
  const [mediaOpen, setMediaOpen] = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  function handleCoverSelect(file: MediaFile) {
    setCoverUrl(file.url);
  }

  return (
    <form action={action} className="space-y-6">
      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main content column ── */}
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
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title…"
              className="h-10 w-full rounded-md border border-border bg-input px-3 text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug{" "}
              <span className="text-xs text-muted-foreground">(auto-generated from title)</span>
            </label>
            <div className="flex items-center overflow-hidden rounded-md border border-border bg-input">
              <span className="border-r border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                /blog/
              </span>
              <input
                id="slug"
                name="slug"
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                placeholder="my-post-slug"
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt{" "}
              <span className="text-xs text-muted-foreground">
                (shown in post cards, search results, and meta description)
              </span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={defaultValues?.excerpt}
              placeholder="A short summary shown in previews, search results, and social shares…"
              className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Rich text editor */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Content <span className="text-red-400">*</span>
            </label>
            <RichTextEditor name="content" defaultValue={defaultValues?.content} />
          </div>
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-5">

          {/* Publish */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold">Publish</h3>
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
                Status
              </label>
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

          {/* Cover Image */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Cover Image</h3>

            {/* Preview */}
            {coverUrl ? (
              <div className="group relative overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="aspect-[16/9] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black group-hover:flex"
                  title="Remove cover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              >
                <ImageIcon className="h-8 w-8 opacity-40" />
                <span className="text-xs">Click to choose from Media Library</span>
              </button>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="flex-1 rounded-md border border-border bg-muted/30 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {coverUrl ? "Change Image" : "Choose Image"}
              </button>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Manual URL override */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Or paste a URL directly</label>
              <input
                id="cover_image_url"
                name="cover_image_url"
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className="h-8 w-full rounded-md border border-border bg-input px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <p className="text-[11px] text-muted-foreground">Recommended: 1200×630 px (16:9)</p>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Tags</h3>
            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-xs text-muted-foreground">
                Comma-separated (e.g. haircut, grooming, tips)
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="haircut, grooming, tips"
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {tags.trim() && (
              <div className="flex flex-wrap gap-1.5">
                {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SEO tips */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">SEO Checklist</h3>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className={title.length >= 40 && title.length <= 70 ? "text-green-400" : ""}>
                {title.length >= 40 && title.length <= 70 ? "✓" : "○"} Title: {title.length}/70 chars (aim 40–70)
              </li>
              <li className={coverUrl ? "text-green-400" : ""}>
                {coverUrl ? "✓" : "○"} Cover image set
              </li>
              <li className={tags.trim() ? "text-green-400" : ""}>
                {tags.trim() ? "✓" : "○"} Tags added
              </li>
              <li className="opacity-60">• Include main keyword in title &amp; slug</li>
              <li className="opacity-60">• Excerpt ≈ meta description (150–160 chars)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Media library modal for cover image */}
      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleCoverSelect}
        selectLabel="Use as Cover Image"
      />
    </form>
  );
}
