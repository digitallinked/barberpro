"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 100);
}

const PostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(120).trim(),
  excerpt: z.string().max(500).trim().optional(),
  content: z.string().min(1),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

async function getActorInfo() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { email: "unknown", name: "Unknown" };

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from("admin_staff").select("name").eq("email", user.email.toLowerCase()).maybeSingle() as { data: { name: string } | null };
    return { email: user.email, name: data?.name ?? user.email };
  } catch {
    return { email: "unknown", name: "Unknown" };
  }
}

export async function createPost(formData: FormData) {
  await requireAccess("/blog");

  const rawTitle = formData.get("title") as string ?? "";
  const rawSlug = formData.get("slug") as string;
  const slug = rawSlug?.trim() || slugify(rawTitle);

  const parsed = PostSchema.safeParse({
    title: rawTitle,
    slug,
    excerpt: formData.get("excerpt") ?? undefined,
    content: formData.get("content") ?? "",
    cover_image_url: formData.get("cover_image_url") ?? "",
    status: formData.get("status") ?? "draft",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const actor = await getActorInfo();
  const supabase = createAdminClient();

  const publishedAt = parsed.data.status === "published" ? new Date().toISOString() : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      cover_image_url: parsed.data.cover_image_url || null,
      status: parsed.data.status,
      author_email: actor.email,
      author_name: actor.name,
      published_at: publishedAt,
    })
    .select("id")
    .single() as { data: { id: string } | null; error: { message: string; code: string } | null };

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." };
    return { error: error.message };
  }

  if (!data) return { error: "Failed to create post" };
  await logAdminAction({ action: "blog.create", targetType: "blog_post", targetId: data.id });
  revalidatePath("/blog");
  redirect(`/blog/${data.id}`);
}

export async function updatePost(formData: FormData) {
  await requireAccess("/blog");

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid post ID." };

  const rawTitle = formData.get("title") as string ?? "";
  const rawSlug = formData.get("slug") as string;
  const slug = rawSlug?.trim() || slugify(rawTitle);

  const parsed = PostSchema.safeParse({
    title: rawTitle,
    slug,
    excerpt: formData.get("excerpt") ?? undefined,
    content: formData.get("content") ?? "",
    cover_image_url: formData.get("cover_image_url") ?? "",
    status: formData.get("status") ?? "draft",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (supabase as any).from("blog_posts").select("published_at, status").eq("id", id).maybeSingle() as { data: { published_at: string | null; status: string } | null };
  const wasPublished = existing.data?.status === "published";
  const nowPublished = parsed.data.status === "published";
  const publishedAt = nowPublished && !wasPublished ? new Date().toISOString() : (existing.data?.published_at ?? null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("blog_posts")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      cover_image_url: parsed.data.cover_image_url || null,
      status: parsed.data.status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id) as { error: { message: string; code: string } | null };

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." };
    return { error: error.message };
  }

  if (nowPublished && !wasPublished) {
    await logAdminAction({ action: "blog.publish", targetType: "blog_post", targetId: id });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  return { success: true };
}

export async function deletePost(formData: FormData) {
  await requireAccess("/blog");

  const id = formData.get("id") as string;
  if (!id) return { error: "Invalid post ID." };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id) as { error: { message: string } | null };

  if (error) return { error: error.message };

  await logAdminAction({ action: "blog.delete", targetType: "blog_post", targetId: id });
  revalidatePath("/blog");
  redirect("/blog");
}
