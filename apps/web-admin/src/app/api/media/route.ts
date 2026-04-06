import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAccess } from "@/lib/require-access";

const BUCKET = "blog-media";

export async function GET() {
  try {
    await requireAccess("/blog");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl: baseUrl } } = supabase.storage.from(BUCKET).getPublicUrl("");

  const files = (data ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name,
      id: f.id,
      size: f.metadata?.size ?? 0,
      mimeType: f.metadata?.mimetype ?? "image/*",
      createdAt: f.created_at,
      url: `${baseUrl.replace(/\/$/, "")}/${f.name}`,
    }));

  return NextResponse.json({ files });
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAccess("/blog");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json() as { name: string };
  if (!name) return NextResponse.json({ error: "Missing file name" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
