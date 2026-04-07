/** Public bucket for tenant logos and shop gallery images. */
export const SHOP_MEDIA_BUCKET = "shop-media" as const;

/**
 * Max upload size per file (bytes). Must stay within Supabase Storage bucket
 * `file_size_limit` and Image Transformation source limit (~25 MB).
 */
export const SHOP_MEDIA_MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Human-readable limit for UI copy. */
export const SHOP_MEDIA_MAX_FILE_LABEL = "20 MB";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Encode each path segment for use in a URL path (slashes preserved). */
function encodeObjectPath(storagePath: string): string {
  return storagePath
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/**
 * Standard public object URL (full-resolution file as stored).
 */
export function shopMediaObjectPublicUrl(
  storagePath: string,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
): string {
  const root = normalizeBaseUrl(supabaseUrl);
  const path = encodeObjectPath(storagePath);
  return `${root}/storage/v1/object/public/${SHOP_MEDIA_BUCKET}/${path}`;
}

export type ShopMediaTransformOptions = {
  /** Long edge / width for resize (Supabase: 1–2500). */
  width: number;
  /** 20–100; higher = sharper, larger payload. Default when omitted: provider default (~80). */
  quality?: number;
};

/**
 * URL for displaying shop media. When `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=true`
 * and a width is given, uses Storage Image Transformation (resize on the fly).
 * Original file stays in the bucket; this only affects delivery.
 *
 * GIFs skip transformation so animations are preserved.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function shopMediaDisplayUrl(
  storagePath: string,
  transform?: ShopMediaTransformOptions,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
): string {
  const plain = shopMediaObjectPublicUrl(storagePath, supabaseUrl);
  const enabled = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === "true";
  if (!enabled || !transform?.width) return plain;

  const lower = storagePath.toLowerCase();
  if (lower.endsWith(".gif")) return plain;

  const root = normalizeBaseUrl(supabaseUrl);
  const path = encodeObjectPath(storagePath);
  const params = new URLSearchParams();
  params.set("width", String(transform.width));
  if (transform.quality != null) params.set("quality", String(transform.quality));

  return `${root}/storage/v1/render/image/public/${SHOP_MEDIA_BUCKET}/${path}?${params.toString()}`;
}
