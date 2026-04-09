"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Rocket,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { useBranchContext } from "@/components/branch-context";
import { useBranchImages, useStaffMembers } from "@/hooks";
import { updateBranchMode } from "@/actions/branches";
import {
  SHOP_MEDIA_MAX_FILE_BYTES,
  SHOP_MEDIA_MAX_FILE_LABEL,
  shopMediaObjectPublicUrl,
} from "@barberpro/db/shop-media";
import { saveBranchLogo, removeBranchLogo, addBranchImage, deleteBranchImage } from "@/actions/branch-media";
import { useSupabase } from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import type { BranchImage } from "@/services/branches";

function publicUrl(storagePath: string) {
  return shopMediaObjectPublicUrl(storagePath);
}

function ModeToggle({
  label, description, enabled, onChange, icon: Icon,
}: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
  icon: React.ElementType;
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
        className={`relative mt-0.5 inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer rounded-full border border-black/20 shadow-inner transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 ${enabled ? "bg-[#D4AF37]" : "bg-white/10"}`}
      >
        <span aria-hidden className={`pointer-events-none absolute left-0.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out ${enabled ? "translate-x-6" : "translate-x-0"}`} />
      </button>
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export default function BranchOverviewPage() {
  const branch = useBranchContext();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const tenant = useTenant();
  const isStarter = tenant.tenantPlan === "starter";

  const { data: staffData } = useStaffMembers();
  const { data: imagesData, isLoading: imagesLoading } = useBranchImages(branch.id);

  const staffMembers = staffData?.data ?? [];
  const branchStaff = staffMembers.filter((s) => s.branch_id === branch.id);
  const images: BranchImage[] = imagesData?.data ?? [];
  const GALLERY_LIMIT = isStarter ? 3 : 10;

  // Booking Mode
  const [acceptsOnline, setAcceptsOnline] = useState<boolean | null>(null);
  const [acceptsWalkin, setAcceptsWalkin] = useState<boolean | null>(null);
  const [modeIsPending, startModeTransition] = useTransition();
  const [modeSuccess, setModeSuccess] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const effectiveOnline = acceptsOnline ?? branch.accepts_online_bookings;
  const effectiveWalkin = acceptsWalkin ?? branch.accepts_walkin_queue;

  function handleModeChange(field: "online" | "walkin", value: boolean) {
    if (field === "online") setAcceptsOnline(value);
    else setAcceptsWalkin(value);
    const newOnline = field === "online" ? value : effectiveOnline;
    const newWalkin = field === "walkin" ? value : effectiveWalkin;
    setModeError(null); setModeSuccess(false);
    startModeTransition(async () => {
      const result = await updateBranchMode(branch.id, newOnline, newWalkin);
      if (result.success) {
        setModeSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["branch-by-slug"] });
        setTimeout(() => setModeSuccess(false), 3000);
      } else {
        setModeError(result.error ?? "Failed to save");
        if (field === "online") setAcceptsOnline(!value);
        else setAcceptsWalkin(!value);
      }
    });
  }

  // Media
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Only JPEG, PNG, WebP, or GIF images are allowed."); return;
    }
    if (file.size > SHOP_MEDIA_MAX_FILE_BYTES) {
      setLogoError(`Logo must be smaller than ${SHOP_MEDIA_MAX_FILE_LABEL}.`); return;
    }
    setLogoError(null); setLogoUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${tenant.tenantId}/branches/${branch.id}/logo/logo.${ext}`;
    const { error: uploadError } = await supabase.storage.from("shop-media").upload(storagePath, file, { upsert: true, contentType: file.type });
    if (uploadError) { setLogoError(uploadError.message); setLogoUploading(false); return; }
    const result = await saveBranchLogo(branch.id, storagePath);
    setLogoUploading(false);
    if (!result.success) { setLogoError(result.error ?? "Failed to save logo"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch-by-slug"] });
  }

  async function handleLogoRemove() {
    setLogoError(null); setLogoUploading(true);
    const result = await removeBranchLogo(branch.id);
    setLogoUploading(false);
    if (!result.success) { setLogoError(result.error ?? "Failed to remove logo"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch-by-slug"] });
  }

  async function handleImagesUpload(files: FileList) {
    if (!files.length) return;
    if (images.length >= GALLERY_LIMIT) return;
    const invalid = Array.from(files).find((f) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type));
    if (invalid) { setImageError("Only JPEG, PNG, WebP, or GIF images are allowed."); return; }
    const tooBig = Array.from(files).find((f) => f.size > SHOP_MEDIA_MAX_FILE_BYTES);
    if (tooBig) { setImageError(`Each image must be smaller than ${SHOP_MEDIA_MAX_FILE_LABEL}.`); return; }
    setImageError(null); setImageUploading(true);
    const nextOrder = images.length;
    const uploadCount = Math.min(files.length, GALLERY_LIMIT - images.length);
    for (let i = 0; i < uploadCount; i++) {
      const file = files[i]!;
      const ext = file.name.split(".").pop() ?? "jpg";
      const timestamp = Date.now() + i;
      const storagePath = `${tenant.tenantId}/branches/${branch.id}/images/${timestamp}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("shop-media").upload(storagePath, file, { contentType: file.type });
      if (uploadError) { setImageError(uploadError.message); setImageUploading(false); return; }
      const result = await addBranchImage(branch.id, storagePath, nextOrder + i);
      if (!result.success) { setImageError(result.error ?? "Failed to save image"); setImageUploading(false); return; }
    }
    setImageUploading(false);
    queryClient.invalidateQueries({ queryKey: ["branch-images", branch.id] });
  }

  async function handleDeleteImage(image: BranchImage) {
    setDeletingId(image.id);
    await supabase.storage.from("shop-media").remove([image.storage_path]);
    const result = await deleteBranchImage(branch.id, image.id);
    setDeletingId(null);
    if (!result.success) { setImageError(result.error ?? "Failed to delete image"); return; }
    queryClient.invalidateQueries({ queryKey: ["branch-images", branch.id] });
  }

  const operatingHours = branch.operating_hours as Record<string, string> | null;
  const hoursOrdered = operatingHours
    ? DAYS.filter((d) => operatingHours[d] !== undefined).map((d) => `${d.slice(0, 3)}: ${operatingHours[d]}`).join(" · ")
    : null;

  return (
    <div className="space-y-6">
      {/* Contact & Hours */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoRow icon={MapPin} label="Address" value={branch.address ?? "—"} />
        <InfoRow icon={Phone} label="Phone" value={branch.phone ?? "—"} />
        <InfoRow icon={Mail} label="Email" value={branch.email ?? "—"} />
        <div className="sm:col-span-2 lg:col-span-3">
          <InfoRow icon={Clock} label="Operating Hours" value={hoursOrdered ?? "Not set"} />
        </div>
      </div>

      {/* Branch Media */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Branch Logo</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
            {branch.logo_url ? (
              <img src={publicUrl(branch.logo_url)} alt="Branch logo" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-600" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogoUpload(f); e.target.value = ""; }} />
            <button type="button" disabled={logoUploading} onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50">
              {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {branch.logo_url ? "Replace Logo" : "Upload Logo"}
            </button>
            {branch.logo_url && (
              <button type="button" disabled={logoUploading} onClick={() => void handleLogoRemove()}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                <X className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </div>
        {logoError && <p className="mt-2 text-sm text-red-400">{logoError}</p>}
      </div>

      {/* Gallery */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">Gallery</h3>
            <span className="text-xs text-gray-500">({images.length}/{GALLERY_LIMIT})</span>
          </div>
          <div className="flex items-center gap-2">
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only"
              onChange={(e) => { if (e.target.files?.length) void handleImagesUpload(e.target.files); e.target.value = ""; }} />
            <button type="button" disabled={imageUploading || images.length >= GALLERY_LIMIT} onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50">
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Photos
            </button>
          </div>
        </div>
        {imageError && <p className="mb-3 text-sm text-red-400">{imageError}</p>}
        {imagesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading photos…</div>
        ) : images.length === 0 ? (
          <div role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(e) => e.key === "Enter" && imageInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-center transition hover:border-[#D4AF37]/40">
            <ImageIcon className="h-6 w-6 text-[#D4AF37]" />
            <p className="text-sm font-medium text-white">Add your first branch photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                <img src={publicUrl(img.storage_path)} alt="Branch photo" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" disabled={deletingId === img.id} onClick={() => void handleDeleteImage(img)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50">
                    {deletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Mode */}
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">Booking Mode</h3>
            <p className="mt-1 text-xs text-gray-500">Control how customers can visit this branch.</p>
          </div>
          {modeIsPending && <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />}
        </div>
        {modeSuccess && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Mode saved.
          </div>
        )}
        {modeError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {modeError}
          </div>
        )}
        <div className="space-y-3">
          <ModeToggle label="Accept online appointments" description="Customers can book a time via the BarberPro website."
            enabled={effectiveOnline} onChange={(v) => handleModeChange("online", v)} icon={CalendarCheck} />
          <ModeToggle label="Accept walk-in queue" description="Customers can join via QR scan or the app."
            enabled={effectiveWalkin} onChange={(v) => handleModeChange("walkin", v)} icon={Hash} />
        </div>
      </div>

      {/* Staff at this Branch */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
          <User className="h-4 w-4 text-[#D4AF37]" /> Staff at this Branch ({branchStaff.length})
        </h3>
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
    </div>
  );
}
