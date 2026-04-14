"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Image as ImageIcon, Loader2, Save, Upload, X } from "lucide-react";

import { useTenant } from "@/components/tenant-provider";
import { useTenantProfile } from "@/hooks";
import { useSupabase } from "@/hooks";
import { updateTenantProfile } from "@/actions/settings";
import { SHOP_MEDIA_MAX_FILE_BYTES, SHOP_MEDIA_MAX_FILE_LABEL, shopMediaObjectPublicUrl } from "@barberpro/db/shop-media";
import { saveTenantLogo, removeTenantLogo } from "@/actions/shop-media";
import { useT } from "@/lib/i18n/language-context";

function FormField({
  label,
  name,
  type = "text",
  value = "",
  placeholder = "",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}

export default function WorkspaceProfilePage() {
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const supabase = useSupabase();
  const { data: profileResult } = useTenantProfile();
  const t = useT();

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<React.ElementRef<"input">>(null);

  const profile = profileResult?.data ?? null;

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateTenantProfile(fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      setFormSuccess(t.settings.profileUpdated);
    } else {
      setFormError(result.error ?? "Failed to update profile");
    }
  }

  async function handleLogoUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > SHOP_MEDIA_MAX_FILE_BYTES) {
      setLogoError(`Logo must be smaller than ${SHOP_MEDIA_MAX_FILE_LABEL}.`);
      return;
    }
    setLogoError(null);
    setLogoUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${tenant.tenantId}/logo/logo.${ext}`;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-white">{t.settings.businessProfileTitle}</h2>
          </div>
          <p className="text-sm text-gray-400">{t.settings.businessProfileSubtitle}</p>
        </div>
        <button
          type="submit"
          form="profile-form"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" /> {t.common.saveChanges}
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <form
          id="profile-form"
          key={profile ? "loaded" : "loading"}
          onSubmit={handleProfileSubmit}
          className="space-y-5"
        >
          {formError && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
          )}
          {formSuccess && (
            <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{formSuccess}</div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t.settings.businessName}
              name="name"
              value={profile?.name ?? tenant.tenantName ?? ""}
              placeholder={t.settings.businessName}
            />
            <FormField
              label={t.settings.registrationNumber}
              name="registration_number"
              value={profile?.registration_number ?? ""}
              placeholder="SSM Number"
            />
          </div>

          <FormField
            label={t.settings.addressLine1}
            name="address_line1"
            value={profile?.address_line1 ?? ""}
            placeholder={t.settings.addressLine1}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t.settings.city}
              name="city"
              value={profile?.city ?? ""}
              placeholder={t.settings.city}
            />
            <FormField
              label={t.settings.postcode}
              name="postcode"
              value={profile?.postcode ?? ""}
              placeholder={t.settings.postcode}
            />
            <FormField
              label={t.settings.state}
              name="state"
              value={profile?.state ?? ""}
              placeholder={t.settings.state}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t.settings.phoneNumber}
              name="phone"
              type="tel"
              value={profile?.phone ?? ""}
              placeholder="+60"
            />
            <FormField
              label={t.settings.email}
              name="email"
              type="email"
              value={profile?.email ?? ""}
              placeholder="email@example.com"
            />
          </div>
        </form>

        {/* Brand Logo */}
        <div className="mt-6 border-t border-white/5 pt-6">
          <p className="mb-1 text-sm font-semibold text-gray-300">Brand Logo</p>
          <p className="mb-3 text-xs text-gray-500">
            Appears on the customer-facing shop page and search results. Use a square image for best results.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
              {profile?.logo_url ? (
                <img
                  src={shopMediaObjectPublicUrl(profile.logo_url)}
                  alt="Brand logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-7 w-7 text-gray-600" />
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
                {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {profile?.logo_url ? "Replace Logo" : "Upload Logo"}
              </button>
              {profile?.logo_url && (
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
          <p className="mt-2 text-xs text-gray-600">
            JPEG, PNG, WebP or GIF · max {SHOP_MEDIA_MAX_FILE_LABEL} · recommended 400 × 400 px
          </p>
        </div>
      </div>
    </div>
  );
}
