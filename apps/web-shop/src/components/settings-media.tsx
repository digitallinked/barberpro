"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react";

import { useTenant } from "@/components/tenant-provider";
import { useTenantProfile, useTenantImages } from "@/hooks";
import { useSupabase } from "@/hooks";
import { saveTenantLogo, removeTenantLogo, addTenantImage, deleteTenantImage } from "@/actions/shop-media";
import type { TenantImage } from "@/services/tenants";

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/shop-media";

function publicUrl(storagePath: string) {
  return `${STORAGE_URL}/${storagePath}`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export function SettingsMedia() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  const supabase = useSupabase();
  const { data: profileResult } = useTenantProfile();
  const { data: imagesResult, isLoading: imagesLoading } = useTenantImages();

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = profileResult?.data?.logo_url ?? null;
  const images: TenantImage[] = imagesResult?.data ?? [];

  async function handleLogoUpload(file: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo must be smaller than 5 MB.");
      return;
    }

    setLogoError(null);
    setLogoUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${tenantId}/logo/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-media")
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setLogoError(uploadError.message);
      setLogoUploading(false);
      return;
    }

    const result = await saveTenantLogo(storagePath);
    setLogoUploading(false);

    if (!result.success) {
      setLogoError(result.error ?? "Failed to save logo");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
  }

  async function handleLogoRemove() {
    setLogoError(null);
    setLogoUploading(true);
    const result = await removeTenantLogo();
    setLogoUploading(false);
    if (!result.success) {
      setLogoError(result.error ?? "Failed to remove logo");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
  }

  async function handleImagesUpload(files: FileList) {
    if (!files.length) return;

    const invalid = Array.from(files).find(
      (f) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (invalid) {
      setImageError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    const tooBig = Array.from(files).find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setImageError("Each image must be smaller than 5 MB.");
      return;
    }

    setImageError(null);
    setImageUploading(true);

    const nextOrder = images.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const ext = file.name.split(".").pop() ?? "jpg";
      const timestamp = Date.now() + i;
      const storagePath = `${tenantId}/images/${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("shop-media")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) {
        setImageError(uploadError.message);
        setImageUploading(false);
        return;
      }

      const result = await addTenantImage(storagePath, nextOrder + i);
      if (!result.success) {
        setImageError(result.error ?? "Failed to save image");
        setImageUploading(false);
        return;
      }
    }

    setImageUploading(false);
    queryClient.invalidateQueries({ queryKey: ["tenant-images"] });
  }

  async function handleDeleteImage(image: TenantImage) {
    setDeletingId(image.id);

    await supabase.storage.from("shop-media").remove([image.storage_path]);
    const result = await deleteTenantImage(image.id);

    setDeletingId(null);
    if (!result.success) {
      setImageError(result.error ?? "Failed to delete image");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["tenant-images"] });
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="mb-1 text-xl font-bold text-white">Shop Media</h3>
        <p className="text-sm text-gray-400">
          Upload your logo and gallery photos. These appear on your public shop page and customer-facing screens.
        </p>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold text-gray-300">Shop Logo</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
            {logoUrl ? (
              <img
                src={publicUrl(logoUrl)}
                alt="Shop logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-600" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleLogoUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={logoUploading}
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {logoUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {logoUrl ? "Replace Logo" : "Upload Logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => void handleLogoRemove()}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Remove Logo
              </button>
            )}
          </div>
        </div>
        {logoError && (
          <p className="mt-2 text-sm text-red-400">{logoError}</p>
        )}
        <p className="mt-2 text-xs text-gray-600">JPEG, PNG, WebP or GIF · max 5 MB · recommended 400 × 400 px</p>
      </div>

      {/* Gallery Images */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">
            Shop Gallery
            <span className="ml-2 text-xs font-normal text-gray-500">({images.length}/10 photos)</span>
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void handleImagesUpload(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={imageUploading || images.length >= 10}
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
          >
            {imageUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Photos
          </button>
        </div>

        {imageError && (
          <p className="mb-3 text-sm text-red-400">{imageError}</p>
        )}

        {imagesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading images…
          </div>
        ) : images.length === 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => imageInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && imageInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-12 text-center transition hover:border-[#D4AF37]/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <ImageIcon className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Add your first shop photo</p>
              <p className="mt-1 text-xs text-gray-500">Showcase your barber chairs, décor, and work</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#111]"
              >
                <img
                  src={publicUrl(img.storage_path)}
                  alt="Shop photo"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={deletingId === img.id}
                    onClick={() => void handleDeleteImage(img)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {deletingId === img.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {images.length < 10 && (
              <button
                type="button"
                disabled={imageUploading}
                onClick={() => imageInputRef.current?.click()}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-gray-600 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs">Add photo</span>
              </button>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-600">
          JPEG, PNG, WebP or GIF · max 5 MB per image · up to 10 photos
        </p>
      </div>
    </Card>
  );
}
