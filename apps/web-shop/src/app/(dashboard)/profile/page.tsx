"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  KeyRound,
  LogOut,
  Save,
  User,
  Pencil,
  X,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useTenant } from "@/components/tenant-provider";
import { useSupabase } from "@/hooks";
import { signOut } from "@/actions/auth";
import {
  changePassword,
  updatePreferredLanguage,
  updateUserProfile,
  getCurrentUserProfile,
  saveUserAvatar,
  removeUserAvatar,
  deleteMyAccount,
} from "@/actions/settings";
import { shopMediaObjectPublicUrl } from "@barberpro/db/shop-media";
import { useLanguage, useT } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarPublicUrl(storagePath: string): string {
  return shopMediaObjectPublicUrl(storagePath);
}

// ─── Reusable alert banners ───────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a1a] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/20">
            <Icon className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-50";

const readOnlyClass =
  "w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-gray-400 cursor-default select-all";

// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({
  src,
  initials,
  size = "lg",
  className = "",
}: {
  src?: string | null;
  initials: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const dim = size === "lg" ? "h-20 w-20 text-2xl rounded-2xl" : "h-10 w-10 text-sm rounded-full";
  return src ? (
    <img
      src={src}
      alt="Profile photo"
      className={`${dim} border-2 border-[#D4AF37]/30 object-cover shadow-lg shadow-[#D4AF37]/10 ${className}`}
    />
  ) : (
    <div
      className={`${dim} flex items-center justify-center border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/25 to-[#D4AF37]/10 font-bold text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 ${className}`}
    >
      {initials}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const supabase = useSupabase();
  const t = useT();
  const { language, setLanguage } = useLanguage();

  // ── Avatar state ──
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(tenant.userAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // ── Account edit state ──
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(tenant.userName);
  const [editPhone, setEditPhone] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ── Password state ──
  const [pwPending, setPwPending] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // ── Preferences state ──
  const [prefPending, setPrefPending] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  // ── Delete account state (3-level confirmation) ──
  // Level 1: panel open, Level 2: checkbox ticked, Level 3: email typed
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch full user profile (including phone) when entering edit mode
  useEffect(() => {
    if (!editing) return;
    setLoadingProfile(true);
    getCurrentUserProfile().then((res) => {
      if (res.success && res.data) {
        setEditName(res.data.full_name || tenant.userName);
        setEditPhone(res.data.phone ?? "");
      }
      setLoadingProfile(false);
    });
  }, [editing, tenant.userName, tenant.userPhone]);

  // ── Avatar handlers ──

  async function handleAvatarUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Photo must be smaller than 5 MB.");
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${tenant.tenantId}/avatars/${tenant.appUserId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-media")
      .upload(storagePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setAvatarError(uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const result = await saveUserAvatar(storagePath);
    setAvatarUploading(false);

    if (!result.success) {
      setAvatarError(result.error ?? "Failed to save photo");
      return;
    }

    setAvatarUrl(storagePath);
    router.refresh();
  }

  async function handleAvatarRemove() {
    setAvatarError(null);
    setAvatarUploading(true);

    if (avatarUrl) {
      await supabase.storage.from("shop-media").remove([avatarUrl]);
    }
    const result = await removeUserAvatar();
    setAvatarUploading(false);

    if (!result.success) {
      setAvatarError(result.error ?? "Failed to remove photo");
      return;
    }

    setAvatarUrl("");
    router.refresh();
  }

  function handleCancelEdit() {
    setEditing(false);
    setProfileError(null);
    setProfileSuccess(null);
    setEditName(tenant.userName);
    setEditPhone(tenant.userPhone);
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfilePending(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateUserProfile(fd);
    setProfilePending(false);
    if (result.success) {
      setProfileSuccess(t.profile.profileSaved);
      setEditing(false);
      router.refresh();
    } else {
      setProfileError(result.error ?? "Failed to update profile");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    setPwPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await changePassword(fd);
    setPwPending(false);
    if (result.success) {
      setPwSuccess(t.profile.passwordChanged);
      (e.target as HTMLFormElement).reset();
    } else {
      setPwError(result.error ?? "Failed to change password");
    }
  }

  async function handlePreferencesSave() {
    setPrefError(null);
    setPrefSuccess(null);
    setPrefPending(true);
    const result = await updatePreferredLanguage(selectedLang);
    setPrefPending(false);
    if (result.success) {
      setLanguage(selectedLang);
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      setPrefSuccess(t.profile.preferencesSaved);
    } else {
      setPrefError(result.error ?? "Failed to save preferences");
    }
  }

  async function handleDeleteAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDeleteError(null);
    if (deleteEmail.trim().toLowerCase() !== tenant.userEmail.toLowerCase()) {
      setDeleteError(t.profile.deleteEmailMismatch);
      return;
    }
    setDeletePending(true);
    const result = await deleteMyAccount(deleteEmail.trim());
    // If we get here, deletion failed (success redirects server-side)
    setDeletePending(false);
    if (!result?.success) {
      setDeleteError(result?.error ?? "Failed to delete account");
    }
  }

  const initials = tenant.userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = tenant.userRole
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const avatarSrc = avatarUrl ? avatarPublicUrl(avatarUrl) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">{t.profile.title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{t.profile.subtitle}</p>
      </div>

      {/* ── Profile hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1e1c14] via-[#1a1a1a] to-[#141414] p-6 shadow-xl shadow-black/20">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        <div className="flex items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            <Avatar src={avatarSrc} initials={initials} size="lg" />

            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              title={t.profile.changePhoto}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 opacity-0 transition hover:bg-black/50 hover:opacity-100 disabled:cursor-not-allowed"
            >
              {avatarUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-white">{tenant.userName}</h3>
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-400">
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                <span className="truncate">{tenant.userEmail}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-400">
                <Phone className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                <span className={tenant.userPhone.trim() ? "truncate" : "italic text-gray-500"}>
                  {tenant.userPhone.trim() ? tenant.userPhone : t.profile.phoneNotSet}
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-semibold text-[#D4AF37]">
                <ShieldCheck className="h-3 w-3" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
                {tenant.branchName ?? tenant.tenantName}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 hover:text-[#D4AF37]"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t.profile.editProfile}
            </button>
          )}
        </div>

        {/* Avatar actions row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 hover:text-[#D4AF37] disabled:opacity-50"
          >
            {avatarUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {avatarSrc ? t.profile.changePhoto : t.profile.uploadPhoto}
          </button>
          {avatarSrc && (
            <button
              type="button"
              onClick={() => void handleAvatarRemove()}
              disabled={avatarUploading}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.profile.removePhoto}
            </button>
          )}
          <span className="text-[10px] text-gray-600">JPEG, PNG, WebP · max 5 MB</span>
        </div>
        {avatarError && (
          <p className="mt-2 text-xs text-red-400">{avatarError}</p>
        )}
      </div>

      {/* ── Account info / Edit form ──────────────────────────────────── */}
      <SectionCard
        icon={User}
        title={t.profile.accountInfoTitle}
        subtitle={t.profile.accountInfoSubtitle}
        action={
          editing ? (
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              {t.profile.cancelEdit}
            </button>
          ) : undefined
        }
      >
        {profileSuccess && !editing && <SuccessBanner message={profileSuccess} />}

        {editing ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && <ErrorBanner message={profileError} />}

            {loadingProfile ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
              </div>
            ) : (
              <>
                <Field label={t.profile.fullName}>
                  <input
                    name="full_name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t.profile.fullName}
                    className={inputClass}
                    autoFocus
                  />
                </Field>

                <Field label={t.profile.email} hint={t.profile.emailReadOnly}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      type="email"
                      value={tenant.userEmail}
                      readOnly
                      tabIndex={-1}
                      className={`${readOnlyClass} pl-10`}
                    />
                  </div>
                </Field>

                <Field label={t.profile.phone}>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      name="phone"
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={t.profile.phonePlaceholder}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={profilePending}
                    className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {profilePending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t.profile.saveProfile}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profilePending}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                  >
                    {t.profile.cancelEdit}
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <User className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  {t.profile.fullName}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-white">{tenant.userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <Mail className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  {t.profile.email}
                </p>
                <p className="mt-0.5 truncate text-sm text-gray-300">{tenant.userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  {t.profile.phone}
                </p>
                <p
                  className={`mt-0.5 truncate text-sm ${tenant.userPhone.trim() ? "text-gray-300" : "italic text-gray-500"}`}
                >
                  {tenant.userPhone.trim() ? tenant.userPhone : t.profile.phoneNotSet}
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Security — change password ────────────────────────────────── */}
      <SectionCard icon={KeyRound} title={t.profile.securityTitle} subtitle={t.profile.securitySubtitle}>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && <ErrorBanner message={pwError} />}
          {pwSuccess && <SuccessBanner message={pwSuccess} />}

          <Field label={t.profile.newPassword}>
            <input
              name="new_password"
              type="password"
              required
              minLength={8}
              placeholder={t.profile.atLeast8Chars}
              className={inputClass}
            />
          </Field>

          <Field label={t.profile.confirmPassword}>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              placeholder={t.profile.confirmNewPassword}
              className={inputClass}
            />
          </Field>

          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {pwPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t.common.changePassword}
          </button>
        </form>
      </SectionCard>

      {/* ── Preferences — language ────────────────────────────────────── */}
      <SectionCard icon={Globe} title={t.profile.preferencesTitle} subtitle={t.profile.preferencesSubtitle}>
        {prefError && <ErrorBanner message={prefError} />}
        {prefSuccess && <SuccessBanner message={prefSuccess} />}

        <div className="mt-4 space-y-4">
          <Field label={t.profile.languageLabel} hint={t.profile.languageHint}>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { code: "ms", flag: "🇲🇾", label: t.profile.languageBM },
                  { code: "en", flag: "🇬🇧", label: t.profile.languageEN },
                ] as { code: Language; flag: string; label: string }[]
              ).map(({ code, flag, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedLang(code)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                    selectedLang === code
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
                  }`}
                >
                  <span className="text-2xl">{flag}</span>
                  <p
                    className={`text-sm font-semibold ${
                      selectedLang === code ? "text-[#D4AF37]" : "text-gray-300"
                    }`}
                  >
                    {label}
                  </p>
                  {selectedLang === code && (
                    <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                  )}
                </button>
              ))}
            </div>
          </Field>

          <button
            type="button"
            onClick={() => void handlePreferencesSave()}
            disabled={prefPending}
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {prefPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t.profile.savePreferences}
          </button>
        </div>
      </SectionCard>

      {/* ── Session — sign out ────────────────────────────────────────── */}
      <SectionCard icon={LogOut} title={t.profile.sessionTitle} subtitle={t.profile.sessionSubtitle}>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            {t.auth.signOut}
          </button>
        </form>
      </SectionCard>

      {/* ── Danger Zone — delete account ─────────────────────────────── */}
      <div className="rounded-2xl border border-red-500/20 bg-[#1a1a1a] shadow-xl shadow-black/20">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-red-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
              <TriangleAlert className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-400">{t.profile.dangerZoneTitle}</h3>
              <p className="text-xs text-gray-500">{t.profile.dangerZoneSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {!deleteOpen ? (
            /* ── Level 1: show entry button ── */
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{t.profile.deleteAccountTitle}</p>
                <p className="mt-0.5 text-xs text-gray-500">{t.profile.deleteAccountWarning}</p>
              </div>
              <button
                type="button"
                onClick={() => { setDeleteOpen(true); setDeleteChecked(false); setDeleteEmail(""); setDeleteError(null); }}
                className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10"
              >
                {t.profile.deleteAccountBtn}
              </button>
            </div>
          ) : (
            /* ── Level 2 + 3: confirmation panel ── */
            <form onSubmit={handleDeleteAccount} className="space-y-5">
              {/* Warning box */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-300">{t.profile.deleteAccountTitle}</p>
                    <p className="text-xs leading-relaxed text-red-400/80">{t.profile.deleteAccountWarning}</p>
                    {tenant.userRole === "owner" && (
                      <p className="mt-2 text-xs font-medium text-amber-400">{t.profile.deleteOwnerWarning}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 1 — Checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-red-500/20">
                <input
                  type="checkbox"
                  checked={deleteChecked}
                  onChange={(e) => setDeleteChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-red-500"
                />
                <span className="text-sm text-gray-300">{t.profile.deleteStep1Label}</span>
              </label>

              {/* Step 2 — Email confirmation (only enabled after step 1) */}
              <div className={`space-y-1.5 transition-opacity ${deleteChecked ? "opacity-100" : "pointer-events-none opacity-30"}`}>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
                  {t.profile.deleteStep2Label}
                </label>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => { setDeleteEmail(e.target.value); setDeleteError(null); }}
                  placeholder={t.profile.deleteStep2Placeholder}
                  disabled={!deleteChecked || deletePending}
                  autoComplete="off"
                  className="w-full rounded-xl border border-red-500/20 bg-[#111] px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-[11px] text-gray-600">{t.profile.deleteStep2Hint}: <span className="font-medium text-gray-400">{tenant.userEmail}</span></p>
              </div>

              {/* Error */}
              {deleteError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Step 3 — Final buttons */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={
                    !deleteChecked ||
                    deleteEmail.trim().toLowerCase() !== tenant.userEmail.toLowerCase() ||
                    deletePending
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deletePending ? t.profile.deleteConfirming : t.profile.deleteConfirmBtn}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteOpen(false); setDeleteChecked(false); setDeleteEmail(""); setDeleteError(null); }}
                  disabled={deletePending}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  {t.profile.deleteCancelBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
