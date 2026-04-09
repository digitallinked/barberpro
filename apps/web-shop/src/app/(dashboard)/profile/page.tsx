"use client";

import { useState } from "react";
import { Globe, KeyRound, LogOut, Save, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useTenant } from "@/components/tenant-provider";
import { signOut } from "@/actions/auth";
import { changePassword, updatePreferredLanguage } from "@/actions/settings";
import { useLanguage, useT } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1a1a1a]">
      <div className="flex items-start gap-3 border-b border-white/5 px-6 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
          <Icon className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const t = useT();
  const { language, setLanguage } = useLanguage();

  const [pwPending, setPwPending] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const [prefPending, setPrefPending] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<Language>(language);

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

  const initials = tenant.userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = tenant.userRole
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-white">{t.profile.title}</h2>
        <p className="mt-1 text-sm text-gray-400">{t.profile.subtitle}</p>
      </div>

      {/* Account info */}
      <SectionCard icon={User} title={t.profile.accountInfoTitle} subtitle={t.profile.accountInfoSubtitle}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37]/40 bg-[#D4AF37]/20 text-lg font-bold text-[#D4AF37]">
            {initials}
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">{tenant.userName}</p>
            <p className="text-sm text-gray-400">{tenant.userEmail}</p>
            <span className="inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-gray-300">
              {roleLabel} &bull; {tenant.branchName ?? tenant.tenantName}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Security — change password */}
      <SectionCard icon={KeyRound} title={t.profile.securityTitle} subtitle={t.profile.securitySubtitle}>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{pwSuccess}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">{t.profile.newPassword}</label>
            <input
              name="new_password"
              type="password"
              required
              minLength={6}
              placeholder={t.profile.atLeast6Chars}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">{t.profile.confirmPassword}</label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={6}
              placeholder={t.profile.confirmNewPassword}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t.common.changePassword}
          </button>
        </form>
      </SectionCard>

      {/* Preferences — language */}
      <SectionCard icon={Globe} title={t.profile.preferencesTitle} subtitle={t.profile.preferencesSubtitle}>
        {prefError && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{prefError}</div>
        )}
        {prefSuccess && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{prefSuccess}</div>
        )}
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-300">{t.profile.languageLabel}</p>
            <p className="mb-3 text-xs text-gray-500">{t.profile.languageHint}</p>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setSelectedLang("ms")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                  selectedLang === "ms"
                    ? "border-[#D4AF37] bg-[#D4AF37]/10"
                    : "border-white/10 bg-[#111] hover:border-[#D4AF37]/40"
                }`}
              >
                <span className="text-2xl">🇲🇾</span>
                <p className={`text-sm font-bold ${selectedLang === "ms" ? "text-[#D4AF37]" : "text-white"}`}>
                  {t.profile.languageBM}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang("en")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                  selectedLang === "en"
                    ? "border-[#D4AF37] bg-[#D4AF37]/10"
                    : "border-white/10 bg-[#111] hover:border-[#D4AF37]/40"
                }`}
              >
                <span className="text-2xl">🇬🇧</span>
                <p className={`text-sm font-bold ${selectedLang === "en" ? "text-[#D4AF37]" : "text-white"}`}>
                  {t.profile.languageEN}
                </p>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handlePreferencesSave()}
            disabled={prefPending}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t.profile.savePreferences}
          </button>
        </div>
      </SectionCard>

      {/* Session — sign out */}
      <SectionCard icon={LogOut} title={t.profile.sessionTitle} subtitle={t.profile.sessionSubtitle}>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            {t.auth.signOut}
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
