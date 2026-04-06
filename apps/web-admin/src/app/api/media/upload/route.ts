import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAccess } from "@/lib/require-access";

const BUCKET = "blog-media";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  try {
    await requireAccess("/blog");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, GIF, WebP, or SVG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 400 });
  }

  // Build a unique filename: timestamp-originalname (sanitised)
  const ext = file.name.split(".").pop() ?? "jpg";
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const filename = `${Date.now()}-${baseName}.${ext}`;

  const buffer = await file.arrayBuffer();

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({
    url: publicUrl,
    name: filename,
    size: file.size,
    mimeType: file.type,
  });
}
