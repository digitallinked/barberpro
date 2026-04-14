"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Edit2,
  Hash,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Settings,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useBranchContext } from "@/components/branch-context";
import { useBranchImages, useStaffMembers, useSupabase } from "@/hooks";
import { updateBranch, updateBranchMode } from "@/actions/branches";
import { saveBranchLogo, removeBranchLogo, addBranchImage, deleteBranchImage } from "@/actions/branch-media";
import {
  SHOP_MEDIA_MAX_FILE_BYTES,
  SHOP_MEDIA_MAX_FILE_LABEL,
  shopMediaObjectPublicUrl,
} from "@barberpro/db/shop-media";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import { useTenant } from "@/components/tenant-provider";
import type { BranchImage } from "@/services/branches";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseHours(raw: Record<string, unknown> | null): Record<string, { open: string; close: string; closed: boolean }> {
  const result: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of DAYS) {
    const entry = raw?.[day] ?? raw?.[day.toLowerCase()];
    if (!entry) {
      result[day] = { open: "09:00", close: "22:00", closed: false };
    } else if (typeof entry === "object" && entry !== null) {
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
    result[day] = h?.closed ? "Closed" : `${h?.open ?? "09:00"} - ${h?.close ?? "22:00"}`;
  }
  return result;
}

function publicUrl(storagePath: string) {
  return shopMediaObjectPublicUrl(storagePath);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm text-white break-words">{value}</p>
      </div>
    </div>
  );
}

function OperatingHoursReadOnly({ hours }: { hours: ReturnType<typeof parseHours> }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-[#111] p-3">
      {DAYS.map((day) => {
        const h = hours[day]!;
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-xs font-medium text-gray-500">{day.slice(0, 3)}</span>
            <span className={`text-xs ${h.closed ? "text-gray-600" : "text-gray-400"}`}>
              {h.closed ? "Closed" : "Open"}
            </span>
            {!h.closed && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 font-mono text-xs text-white tabular-nums">
                  {h.open}
                </span>
                <span className="text-xs text-gray-600">–</span>
                <span className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 font-mono text-xs text-white tabular-nums">
                  {h.close}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModeToggle({
  label, description, enabled, onChange, icon: Icon, disabled,
}: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
  icon: React.ElementType; disabled?: boolean;
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
        type="button" role="switch" aria-checked={enabled}
        onClick={() => onChange(!enabled)} disabled={disabled}
        className={`relative mt-0.5 inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer rounded-full border border-black/20 shadow-inner transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? "bg-[#D4AF37]" : "bg-white/10"}`}
      >
        <span aria-hidden className={`pointer-events-none absolute left-0.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out ${enabled ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BranchSettingsPage() {
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

  // ── Edit panel ──────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [hours, setHours] = useState(() => parseHours(branch.operating_hours as Record<string, unknown> | null));

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);
    setEditPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("operating_hours", JSON.stringify(serializeHours(hours)));
    const result = await updateBranch(branch.id, fd);
    setEditPending(false);
    if (result.success) {
      setEditSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["branch-by-slug"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setTimeout(() => {
        setEditSuccess(false);
        setIsEditing(false);
      }, 1000);
    } else {
      setEditError(result.error ?? "Failed to update branch");
    }
  }

  // ── Booking mode ─────────────────────────────────────────────────────────────
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

  // ── Media ────────────────────────────────────────────────────────────────────
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!logoMenuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setLogoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [logoMenuOpen]);

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

  const displayHours = parseHours(branch.operating_hours as Record<string, unknown> | null);

  return (
    <>
      <div className="space-y-6">
        {/* ── Page header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white">Branch Settings</h2>
            </div>
            <p className="text-sm text-gray-400">{branch.name}</p>
          </div>
          <button
            type="button"
            onClick={() => { setIsEditing(true); setEditError(null); setEditSuccess(false); }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <Edit2 className="h-4 w-4" />
            Edit Branch
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#1a1a1a]">
          <div className="divide-y divide-white/5">
            {/* ── Branch identity ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0" ref={logoMenuRef}>
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                    {branch.logo_url ? (
                      <img src={publicUrl(branch.logo_url)} alt={branch.name} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-7 w-7 text-[#D4AF37]" />
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={logoUploading}
                    aria-expanded={logoMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setLogoMenuOpen((o) => !o)}
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-gray-400 shadow-md transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="Logo options"
                  >
                    {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Edit2 className="h-3 w-3" />}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleLogoUpload(f);
                      e.target.value = "";
                      setLogoMenuOpen(false);
                    }} />
                  {logoMenuOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[11rem] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl shadow-black/40"
                    >
                      <button
                        type="button" role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/5"
                        onClick={() => { setLogoMenuOpen(false); logoInputRef.current?.click(); }}
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
                        Change logo
                      </button>
                      {branch.logo_url && (
                        <button
                          type="button" role="menuitem" disabled={logoUploading}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          onClick={() => { setLogoMenuOpen(false); void handleLogoRemove(); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove logo
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{branch.name}</h1>
                    {branch.is_hq && (
                      <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">HQ</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${branch.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {branch.is_active ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-gray-500">{branch.code}</p>
                </div>
              </div>
            </div>

            {logoError && (
              <div className="px-6 py-3 text-sm text-red-400 bg-red-500/5">{logoError}</div>
            )}

            {/* ── Contact ─────────────────────────────────────────────────────── */}
            <div className="p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Contact</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={MapPin} label="Address" value={branch.address ?? "—"} />
                <InfoRow icon={Phone} label="Phone" value={branch.phone ?? "—"} />
                <InfoRow icon={Mail} label="Email" value={branch.email ?? "—"} />
              </div>
            </div>

            {/* ── Operation Hours ──────────────────────────────────────────────── */}
            <div className="p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Operation Hours</h3>
              <OperatingHoursReadOnly hours={displayHours} />
            </div>

            {/* ── Booking Mode ─────────────────────────────────────────────────── */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Booking Mode</h3>
                  <p className="mt-1 text-xs text-gray-600">Control how customers can visit this branch.</p>
                </div>
                {modeIsPending && <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />}
              </div>
              {modeSuccess && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Booking mode saved.
                </div>
              )}
              {modeError && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {modeError}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <ModeToggle label="Online appointments" description="Customers can book a time slot via the app."
                  enabled={effectiveOnline} onChange={(v) => handleModeChange("online", v)} icon={CalendarCheck} disabled={modeIsPending} />
                <ModeToggle label="Walk-in queue" description="Customers can join via QR scan or the app."
                  enabled={effectiveWalkin} onChange={(v) => handleModeChange("walkin", v)} icon={Hash} disabled={modeIsPending} />
              </div>
            </div>

            {/* ── Gallery ──────────────────────────────────────────────────────── */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Gallery <span className="ml-1 normal-case text-gray-600 tracking-normal">({images.length}/{GALLERY_LIMIT})</span>
                </h3>
                <div>
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only"
                    onChange={(e) => { if (e.target.files?.length) void handleImagesUpload(e.target.files); e.target.value = ""; }} />
                  <button type="button" disabled={imageUploading || images.length >= GALLERY_LIMIT} onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50">
                    {imageUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Photos
                  </button>
                </div>
              </div>
              {imageError && <p className="mb-3 text-sm text-red-400">{imageError}</p>}
              {imagesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading photos…</div>
              ) : images.length === 0 ? (
                <div role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(e) => e.key === "Enter" && imageInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-center transition hover:border-[#D4AF37]/30">
                  <ImageIcon className="h-6 w-6 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">Add your first branch photo</p>
                  <p className="text-xs text-gray-600">JPEG, PNG, WebP or GIF · Max {SHOP_MEDIA_MAX_FILE_LABEL}</p>
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

            {/* ── Staff ────────────────────────────────────────────────────────── */}
            <div className="p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Staff at this Branch <span className="ml-1 normal-case tracking-normal text-gray-600">({branchStaff.length})</span>
              </h3>
              {branchStaff.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 p-5">
                  <User className="h-5 w-5 text-gray-600" />
                  <p className="text-sm text-gray-500">No staff assigned to this branch yet.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {branchStaff.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111] p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                        {s.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{s.full_name}</p>
                        <p className="text-xs capitalize text-gray-500">{s.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Slide-over ─────────────────────────────────────────────────────── */}
      {isEditing && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditing(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#141414] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-white">Edit Branch</h2>
                <p className="mt-0.5 text-xs text-gray-500">{branch.name}</p>
              </div>
              <button
                type="button" onClick={() => setIsEditing(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 p-6">
                {editError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved successfully!
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Branch Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="name" required defaultValue={branch.name}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Branch Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="code" required defaultValue={branch.code}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Phone</label>
                    <input
                      name="phone" type="tel" defaultValue={branch.phone ?? ""}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                    <input
                      name="email" type="email" defaultValue={branch.email ?? ""}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Address</label>
                  <PlacesAutocomplete
                    defaultValue={branch.address ?? ""}
                    defaultLat={branch.latitude ?? null}
                    defaultLng={branch.longitude ?? null}
                    placeholder="Search address…"
                    className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <input type="hidden" name="is_hq" value={branch.is_hq ? "true" : "false"} />

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">Operating Hours</label>
                  <div className="space-y-2 rounded-xl border border-white/5 bg-[#111] p-3">
                    {DAYS.map((day) => {
                      const h = hours[day]!;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="w-8 shrink-0 text-xs font-medium text-gray-500">{day.slice(0, 3)}</span>
                          <label className="flex cursor-pointer items-center gap-1.5">
                            <input
                              type="checkbox" checked={!h.closed}
                              onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, closed: !e.target.checked } }))}
                              className="h-3.5 w-3.5 rounded accent-[#D4AF37]"
                            />
                            <span className={`text-xs ${h.closed ? "text-gray-600" : "text-gray-400"}`}>
                              {h.closed ? "Closed" : "Open"}
                            </span>
                          </label>
                          {!h.closed && (
                            <div className="ml-auto flex items-center gap-1.5">
                              <input
                                type="time" value={h.open}
                                onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, open: e.target.value } }))}
                                className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                              />
                              <span className="text-xs text-gray-600">–</span>
                              <input
                                type="time" value={h.close}
                                onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, close: e.target.value } }))}
                                className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/5 p-6">
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={editPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {editPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
