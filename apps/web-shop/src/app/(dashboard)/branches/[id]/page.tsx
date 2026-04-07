"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Rocket,
  Save,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useBranch, useBranchImages, useStaffMembers } from "@/hooks";
import { updateBranch, updateBranchMode, deleteBranch } from "@/actions/branches";
import {
  SHOP_MEDIA_MAX_FILE_BYTES,
  SHOP_MEDIA_MAX_FILE_LABEL,
  shopMediaObjectPublicUrl,
} from "@barberpro/db/shop-media";

import { saveBranchLogo, removeBranchLogo, addBranchImage, deleteBranchImage } from "@/actions/branch-media";
import { useSupabase } from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import type { BranchImage } from "@/services/branches";

function publicUrl(storagePath: string) {
  return shopMediaObjectPublicUrl(storagePath);
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function parseHours(raw: Record<string, unknown> | null): Record<string, { open: string; close: string; closed: boolean }> {
  const result: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of DAYS) {
    // Accept both capitalized ("Monday") and lowercase ("monday") keys from legacy data
    const entry = raw?.[day] ?? raw?.[day.toLowerCase()];
    if (!entry) {
      result[day] = { open: "09:00", close: "22:00", closed: false };
    } else if (typeof entry === "object" && entry !== null) {
      // Legacy object format: { open: "09:00", close: "22:00", closed: false }
      const h = entry as { open?: string; close?: string; closed?: boolean };
      result[day] = { open: h.open ?? "09:00", close: h.close ?? "22:00", closed: h.closed ?? false };
    } else if (typeof entry === "string") {
      if (entry.toLowerCase() === "closed") {
        result[day] = { open: "09:00", close: "22:00", closed: true };
      } else {
        const parts = entry.split(" - ");
        result[day] = { open: parts[0] ?? "09:00", close: parts[1] ?? "22:00", closed: false };
      }
    } else {
      result[day] = { open: "09:00", close: "22:00", closed: false };
    }
  }
  return result;
}

function serializeHours(hours: Record<string, { open: string; close: string; closed: boolean }>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const day of DAYS) {
    const h = hours[day];
    result[day] = h?.closed ? "Closed" : `${h?.open ?? "09:00"} - ${h?.close ?? "18:00"}`;
  }
  return result;
}

function ModeToggle({
  label, description, enabled, onChange, icon: Icon, enabledColor = "bg-[#D4AF37]",
}: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
  icon: React.ElementType; enabledColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-[#111] p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-[#D4AF37]/15" : "bg-white/5"}`}>
          <Icon className={`h-4 w-4 ${enabled ? "text-[#D4AF37]" : "text-gray-500"}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${enabled ? "text-white" : "text-gray-400"}`}>{label}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}
        className={`relative mt-0.5 inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer rounded-full border border-black/20 shadow-inner transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${enabled ? enabledColor : "bg-white/10"}`}
      >
        <span aria-hidden className={`pointer-events-none absolute left-0.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out will-change-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function BranchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const tenant = useTenant();
  const isStarter = tenant.tenantPlan === "starter";

  const { data: branchData, isLoading: branchLoading, error: branchError } = useBranch(id);
  const { data: staffData } = useStaffMembers();
  const { data: imagesData, isLoading: imagesLoading } = useBranchImages(id);

  const branch = branchData?.data ?? null;
  const staffMembers = staffData?.data ?? [];
  const branchStaff = branch ? staffMembers.filter((s) => s.branch_id === branch.id) : [];
  const images: BranchImage[] = imagesData?.data ?? [];

  // Gallery limit by plan: Starter = 3 photos, Professional = 10
  const GALLERY_LIMIT = isStarter ? 3 : 10;

  // ── Booking Mode ──────────────────────────────────────────────────────────────
  const [acceptsOnline, setAcceptsOnline] = useState<boolean | null>(null);
  const [acceptsWalkin, setAcceptsWalkin] = useState<boolean | null>(null);
  const [modeIsPending, startModeTransition] = useTransition();
  const [modeSuccess, setModeSuccess] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const effectiveOnline = acceptsOnline ?? branch?.accepts_online_bookings ?? true;
  const effectiveWalkin = acceptsWalkin ?? branch?.accepts_walkin_queue ?? true;

  function handleModeChange(field: "online" | "walkin", value: boolean) {
    if (field === "online") setAcceptsOnline(value);
    else setAcceptsWalkin(value);

    const newOnline = field === "online" ? value : effectiveOnline;
    const newWalkin = field === "walkin" ? value : effectiveWalkin;
    setModeError(null); setModeSuccess(false);

    startModeTransition(async () => {
      const result = await updateBranchMode(id, newOnline, newWalkin);
      if (result.success) {
        setModeSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["branch", id] });
        setTimeout(() => setModeSuccess(false), 3000);
      } else {
        setModeError(result.error ?? "Failed to save");
        if (field === "online") setAcceptsOnline(!value);
        else setAcceptsWalkin(!value);
      }
    });
  }

  // ── Edit Details Modal ────────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }> | null>(null);

  function openEdit() {
    if (branch) {
      setHours(parseHours(branch.operating_hours as Record<string, string> | null));
    }
    setEditError(null);
    setShowEdit(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);
    setEditPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (hours) {
      fd.set("operating_hours", JSON.stringify(serializeHours(hours)));
    }
    const result = await updateBranch(id, fd);
    setEditPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["branch", id] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setShowEdit(false);
    } else {
      setEditError(result.error ?? "Failed to update branch");
    }
  }

  // ── Branch Media ──────────────────────────────────────────────────────────────
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Only JPEG, PNG, WebP, or GIF images are allowed."); return;
    }
    if (file.size > SHOP_MEDIA_MAX_FILE_BYTES) {
      setLogoError(`Logo must be smaller than ${SHOP_MEDIA_MAX_FILE_LABEL}.`);
      return;
    }

    setLogoError(null); setLogoUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${tenant.tenantId}/branches/${id}/logo/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-media")
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (uploadError) { setLogoError(uploadError.message); setLogoUploading(false); return; }

    const result = await saveBranchLogo(id, storagePath);
    setLogoUploading(false);
    if (!result.success) { setLogoError(result.error ?? "Failed to save logo"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch", id] });
  }

  async function handleLogoRemove() {
    setLogoError(null); setLogoUploading(true);
    const result = await removeBranchLogo(id);
    setLogoUploading(false);
    if (!result.success) { setLogoError(result.error ?? "Failed to remove logo"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch", id] });
  }

  async function handleImagesUpload(files: FileList) {
    if (!files.length) return;
    if (images.length >= GALLERY_LIMIT) { setShowUpgrade(true); return; }

    const invalid = Array.from(files).find(
      (f) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (invalid) { setImageError("Only JPEG, PNG, WebP, or GIF images are allowed."); return; }
    const tooBig = Array.from(files).find((f) => f.size > SHOP_MEDIA_MAX_FILE_BYTES);
    if (tooBig) {
      setImageError(`Each image must be smaller than ${SHOP_MEDIA_MAX_FILE_LABEL}.`);
      return;
    }

    setImageError(null); setImageUploading(true);
    const nextOrder = images.length;
    const uploadCount = Math.min(files.length, GALLERY_LIMIT - images.length);

    for (let i = 0; i < uploadCount; i++) {
      const file = files[i]!;
      const ext = file.name.split(".").pop() ?? "jpg";
      const timestamp = Date.now() + i;
      const storagePath = `${tenant.tenantId}/branches/${id}/images/${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("shop-media")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) { setImageError(uploadError.message); setImageUploading(false); return; }

      const result = await addBranchImage(id, storagePath, nextOrder + i);
      if (!result.success) { setImageError(result.error ?? "Failed to save image"); setImageUploading(false); return; }
    }
    setImageUploading(false);
    queryClient.invalidateQueries({ queryKey: ["branch-images", id] });
  }

  async function handleDeleteImage(image: BranchImage) {
    setDeletingId(image.id);
    await supabase.storage.from("shop-media").remove([image.storage_path]);
    const result = await deleteBranchImage(id, image.id);
    setDeletingId(null);
    if (!result.success) { setImageError(result.error ?? "Failed to delete image"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch-images", id] });
  }

  // ── Derived display values ────────────────────────────────────────────────────
  if (branchLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          <p className="text-sm text-gray-400">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (branchError || !branch) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        <p>Branch not found.</p>
        <Link href="/branches" className="mt-4 inline-flex items-center gap-1 text-sm text-[#D4AF37] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>
      </div>
    );
  }

  const operatingHours = branch.operating_hours as Record<string, string> | null;
  const hoursOrdered = operatingHours
    ? DAYS
        .filter((d) => operatingHours[d] !== undefined)
        .map((d) => `${d.slice(0, 3)}: ${operatingHours[d]}`)
        .join(" · ")
    : null;

  const modeLabel =
    effectiveOnline && effectiveWalkin ? "Accepting bookings & walk-ins"
    : effectiveOnline ? "Appointments only"
    : effectiveWalkin ? "Walk-in queue only"
    : "Not accepting customers";

  const modeBadgeColor =
    effectiveOnline && effectiveWalkin ? "bg-emerald-500/10 text-emerald-400"
    : !effectiveOnline && !effectiveWalkin ? "bg-red-500/10 text-red-400"
    : "bg-amber-500/10 text-amber-400";

  const logoUrl = branch.logo_url;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/branches" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </Link>

      {/* ── Branch Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Branch logo or icon */}
            <div className="relative h-16 w-16 shrink-0">
              {logoUrl ? (
                <img src={publicUrl(logoUrl)} alt={branch.name} className="h-16 w-16 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Store className="h-8 w-8 text-[#D4AF37]" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
                {branch.is_hq && (
                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">HQ</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${branch.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {branch.is_active ? "Open" : "Closed"}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${modeBadgeColor}`}>{modeLabel}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-gray-500">{branch.code}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <Edit2 className="h-4 w-4" /> Edit Details
          </button>
        </div>

        {/* Contact & Hours grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={MapPin} label="Address" value={branch.address ?? "—"} />
          <InfoRow icon={Phone} label="Phone" value={branch.phone ?? "—"} />
          <InfoRow icon={Mail} label="Email" value={branch.email ?? "—"} />
          <div className="sm:col-span-2 lg:col-span-3">
            <InfoRow icon={Clock} label="Operating Hours" value={hoursOrdered ?? "Not set"} />
          </div>
        </div>
      </div>

      {/* ── Branch Media ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Branch Media</h2>
            <p className="mt-1 text-sm text-gray-400">
              Upload a branch logo and gallery photos. These appear on the customer-facing page for this branch.
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-7">
          <p className="mb-3 text-sm font-semibold text-gray-300">Branch Logo</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
              {logoUrl ? (
                <img src={publicUrl(logoUrl)} alt="Branch logo" className="h-full w-full object-cover" />
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
                {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={() => void handleLogoRemove()}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              )}
            </div>
          </div>
          {logoError && <p className="mt-2 text-sm text-red-400">{logoError}</p>}
          <p className="mt-2 text-xs text-gray-600">JPEG, PNG, WebP or GIF · max {SHOP_MEDIA_MAX_FILE_LABEL} · recommended 400 × 400 px</p>
        </div>

        {/* Gallery */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-300">Branch Gallery</p>
              <span className="text-xs text-gray-500">({images.length}/{GALLERY_LIMIT} photos)</span>
              {isStarter && (
                <span className="flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                  <Lock className="h-2.5 w-2.5" /> Starter: 3
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                disabled={imageUploading || images.length >= GALLERY_LIMIT}
                onClick={() => images.length >= GALLERY_LIMIT ? setShowUpgrade(true) : imageInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
              >
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Photos
              </button>
            </div>
          </div>

          {isStarter && images.length >= GALLERY_LIMIT && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
              <Lock className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">Starter limit reached.</span>{" "}
                <button type="button" onClick={() => setShowUpgrade(true)} className="font-semibold text-[#D4AF37] hover:underline">
                  Upgrade to Professional
                </button>{" "}
                for up to 10 photos per branch.
              </p>
            </div>
          )}

          {imageError && <p className="mb-3 text-sm text-red-400">{imageError}</p>}

          {imagesLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading photos…
            </div>
          ) : images.length === 0 ? (
            <div
              role="button" tabIndex={0}
              onClick={() => imageInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && imageInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-12 text-center transition hover:border-[#D4AF37]/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <ImageIcon className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Add your first branch photo</p>
                <p className="mt-1 text-xs text-gray-500">Showcase the interior, chairs, and atmosphere</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                  <img src={publicUrl(img.storage_path)} alt="Branch photo" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={deletingId === img.id}
                      onClick={() => void handleDeleteImage(img)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      {deletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {images.length < GALLERY_LIMIT && (
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
          <p className="mt-3 text-xs text-gray-600">JPEG, PNG, WebP or GIF · max {SHOP_MEDIA_MAX_FILE_LABEL} per image</p>
        </div>
      </div>

      {/* ── Booking Mode ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Booking Mode</h2>
            <p className="mt-1 text-sm text-gray-400">
              Control which channels customers can use to visit this branch. Changes take effect immediately.
            </p>
          </div>
          {modeIsPending && (
            <div className="flex h-6 w-6 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          )}
        </div>

        {modeSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Mode saved successfully.
          </div>
        )}
        {modeError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {modeError}
          </div>
        )}
        {!effectiveOnline && !effectiveWalkin && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span><strong>Warning:</strong> Both modes are off — this branch is not accepting any customers.</span>
          </div>
        )}

        <div className="space-y-3">
          <ModeToggle label="Accept online appointments" description="Customers can book a specific date and time via the BarberPro website."
            enabled={effectiveOnline} onChange={(v) => handleModeChange("online", v)} icon={CalendarCheck} />
          <ModeToggle label="Accept walk-in queue" description="Customers can join the walk-in queue via QR scan or the BarberPro app."
            enabled={effectiveWalkin} onChange={(v) => handleModeChange("walkin", v)} icon={Hash} />
        </div>

        <div className="mt-5 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Appointments only</strong> — ideal for busy shops with full scheduling control.<br />
            <strong className="text-gray-400">Walk-in only</strong> — first-come, first-served basis.<br />
            <strong className="text-gray-400">Both enabled</strong> — customers choose their preferred way to visit.
          </p>
        </div>
      </div>

      {/* ── Staff ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <User className="h-5 w-5 text-[#D4AF37]" /> Staff at this Branch ({branchStaff.length})
        </h2>
        {branchStaff.length === 0 ? (
          <p className="text-sm text-gray-500">No staff assigned to this branch yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {branchStaff.map((s) => (
              <div key={s.id} className="flex items-center gap-4 rounded-lg border border-white/5 bg-[#111] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                  {s.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-white">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Details Modal ────────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <h3 className="text-lg font-bold text-white">Edit Branch Details</h3>
              <button type="button" onClick={() => setShowEdit(false)} className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{editError}</div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch Name <span className="text-red-400">*</span></label>
                  <input name="name" required defaultValue={branch.name}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                    placeholder="Branch name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch Code <span className="text-red-400">*</span></label>
                  <input name="code" required defaultValue={branch.code}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. KL01" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Phone</label>
                  <input name="phone" type="tel" defaultValue={branch.phone ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                    placeholder="+60..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                  <input name="email" type="email" defaultValue={branch.email ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                    placeholder="branch@example.com" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Address</label>
                <PlacesAutocomplete
                  placeholder="Search address…"
                  defaultValue={branch.address ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Operating Hours */}
              {hours && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">Operating Hours</label>
                  <div className="space-y-2 rounded-xl border border-white/5 bg-[#111] p-3">
                    {DAYS.map((day) => {
                      const h = hours[day]!;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs text-gray-400">{day.slice(0, 3)}</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!h.closed}
                              onChange={(e) => setHours((prev) => prev ? { ...prev, [day]: { ...prev[day]!, closed: !e.target.checked } } : prev)}
                              className="h-3.5 w-3.5 rounded accent-[#D4AF37]"
                            />
                            <span className="text-xs text-gray-400">{h.closed ? "Closed" : "Open"}</span>
                          </label>
                          {!h.closed && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <input
                                type="time"
                                value={h.open}
                                onChange={(e) => setHours((prev) => prev ? { ...prev, [day]: { ...prev[day]!, open: e.target.value } } : prev)}
                                className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                              />
                              <span className="text-xs text-gray-600">–</span>
                              <input
                                type="time"
                                value={h.close}
                                onChange={(e) => setHours((prev) => prev ? { ...prev, [day]: { ...prev[day]!, close: e.target.value } } : prev)}
                                className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={editPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50">
                  {editPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upgrade Paywall Modal ─────────────────────────────────────────────── */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="relative my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl text-center">
            <button type="button" onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
              <Rocket className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white">Upgrade to Professional</h3>
            <p className="mt-2 text-sm text-gray-400">
              Your <span className="font-semibold text-white">Starter plan</span> allows up to 3 gallery photos per branch.
              Upgrade to <span className="font-semibold text-white">Professional</span> for 10 photos per branch and unlimited branches.
            </p>
            <ul className="mt-4 space-y-2 text-left">
              {[
                "Up to 10 gallery photos per branch",
                "Unlimited branches",
                "Multi-branch dashboard",
                "Advanced analytics & P&L",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/settings/billing"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
                Upgrade Now — RM 249/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => setShowUpgrade(false)}
                className="rounded-lg py-2 text-sm text-gray-500 hover:text-gray-300">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-white break-words">{value}</p>
      </div>
    </div>
  );
}
