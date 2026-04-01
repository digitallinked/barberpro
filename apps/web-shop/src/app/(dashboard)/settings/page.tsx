"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, Globe, Save, Scale, Search, Shield } from "lucide-react";
import Link from "next/link";

const SST_SETTINGS_KEY = "barberpro:sst";

type SstSettings = {
  registered: boolean;
  sstNumber: string;
  registeredSince: string;
  sstRateOverride: string;
};

function loadSstSettings(): SstSettings {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SST_SETTINGS_KEY) : null;
    if (raw) return JSON.parse(raw) as SstSettings;
  } catch { /* ignore */ }
  return { registered: false, sstNumber: "", registeredSince: "", sstRateOverride: "8" };
}

function saveSstSettings(s: SstSettings) {
  try { localStorage.setItem(SST_SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
import { useTenant } from "@/components/tenant-provider";
import { useTenantProfile } from "@/hooks";
import { updateTenantProfile, changePassword, updatePreferredLanguage } from "@/actions/settings";
import { useLanguage, useT } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/translations";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function FormField({
  label,
  name,
  type = "text",
  value = "",
  placeholder = "",
  required = false
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

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const { data: profileResult } = useTenantProfile();
  const t = useT();
  const { language, setLanguage } = useLanguage();

  const NAV_ITEMS = [
    { id: "profile",    label: t.settings.businessProfile, icon: Building2 },
    { id: "security",   label: t.settings.security,        icon: Shield },
    { id: "preferences",label: t.settings.preferences,     icon: Globe },
    { id: "tax",        label: "Tax & Compliance (MY)",    icon: Scale },
    { id: "billing",    label: t.settings.subscriptionBilling, icon: CreditCard, href: "/settings/billing" as const },
  ];

  const [activeSection, setActiveSection] = useState("profile");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [prefPending, setPrefPending] = useState(false);
  const [sstSettings, setSstSettings] = useState<SstSettings>({ registered: false, sstNumber: "", registeredSince: "", sstRateOverride: "8" });
  const [sstSaved, setSstSaved] = useState(false);

  useEffect(() => { setSstSettings(loadSstSettings()); }, []);

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

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await changePassword(fd);
    setPending(false);
    if (result.success) {
      setFormSuccess(t.settings.passwordChanged);
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to change password");
    }
  }

  async function handlePreferencesSave() {
    setFormError(null);
    setFormSuccess(null);
    setPrefPending(true);
    const result = await updatePreferredLanguage(selectedLang);
    setPrefPending(false);
    if (result.success) {
      setLanguage(selectedLang);
      setFormSuccess(t.settings.preferencesSaved);
    } else {
      setFormError(result.error ?? "Failed to save preferences");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t.settings.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.settings.subtitle}</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t.settings.searchPlaceholder}
            className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="p-3">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                if ("href" in item && item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      activeSection === item.id
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {activeSection === "profile" && (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-xl font-bold text-white">{t.settings.businessProfileTitle}</h3>
                  <p className="text-sm text-gray-400">{t.settings.businessProfileSubtitle}</p>
                </div>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {t.common.saveChanges}
                </button>
              </div>

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
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="mb-1 text-xl font-bold text-white">{t.settings.securityTitle}</h3>
                <p className="text-sm text-gray-400">{t.settings.securitySubtitle}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                {formError && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
                )}
                {formSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{formSuccess}</div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">{t.settings.newPassword}</label>
                  <input
                    name="new_password"
                    type="password"
                    required
                    minLength={6}
                    placeholder={t.settings.atLeast6Chars}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">{t.settings.confirmPassword}</label>
                  <input
                    name="confirm_password"
                    type="password"
                    required
                    minLength={6}
                    placeholder={t.settings.confirmNewPassword}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {t.common.changePassword}
                </button>
              </form>
            </Card>
          )}

          {activeSection === "tax" && (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-xl font-bold text-white">Tax &amp; Compliance (Malaysia)</h3>
                  <p className="text-sm text-gray-400">SST registration details and compliance reference. Stored locally on this device.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveSstSettings(sstSettings);
                    setSstSaved(true);
                    setTimeout(() => setSstSaved(false), 3000);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>

              {sstSaved && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                  Tax settings saved to this browser.
                </div>
              )}

              <div className="space-y-6 max-w-lg">
                {/* SST registration */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-300">Service Tax (SST) registration</p>
                  <label className="flex cursor-pointer items-center gap-3">
                    <div
                      role="switch"
                      aria-checked={sstSettings.registered}
                      onClick={() => setSstSettings((s) => ({ ...s, registered: !s.registered }))}
                      className={`relative h-6 w-11 rounded-full transition ${sstSettings.registered ? "bg-[#D4AF37]" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${sstSettings.registered ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm text-gray-300">
                      {sstSettings.registered ? "Registered for SST" : "Not registered (below RM500k threshold)"}
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] text-gray-600">SST threshold: RM500,000 annual taxable turnover. Register at <a href="https://mysst.customs.gov.my" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">MySSTCustoms</a>.</p>
                </div>

                {sstSettings.registered && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">SST registration number</label>
                      <input
                        type="text"
                        value={sstSettings.sstNumber}
                        onChange={(e) => setSstSettings((s) => ({ ...s, sstNumber: e.target.value }))}
                        placeholder="W10-XXXX-XXXXXXX"
                        className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">Registered since (date)</label>
                      <input
                        type="date"
                        value={sstSettings.registeredSince}
                        onChange={(e) => setSstSettings((s) => ({ ...s, registeredSince: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                  </>
                )}

                {/* SST rate reference */}
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="mb-1 text-sm font-semibold text-[#D4AF37]">Current SST rate: 8%</p>
                  <p className="text-xs text-gray-400">Effective 1 March 2024. Previously 6%. Applied automatically on POS, queue payment, and quick payment transactions.</p>
                </div>

                {/* MY statutory reference */}
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
                  <p className="text-sm font-semibold text-white">Statutory contribution reference</p>
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-300">EPF employee</span><span>11% (&lt;60) / 5.5% (≥60)</span>
                    <span className="font-medium text-gray-300">EPF employer</span><span>13% (≤RM5k) / 12% (&gt;RM5k)</span>
                    <span className="font-medium text-gray-300">SOCSO (insurable cap)</span><span>Employee 0.5%, Employer 1.75% (≤RM5k)</span>
                    <span className="font-medium text-gray-300">EIS (insurable cap)</span><span>0.2% each (≤RM5k)</span>
                    <span className="font-medium text-gray-300">PCB/MTD</span><span>Progressive (see annual tax tab)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pt-1">Rates verified against KWSP, PERKESO, and LHDN schedules (2024). Always cross-check portals for updates.</p>
                </div>

                {/* Key portals */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-300">Key government portals</p>
                  <ul className="space-y-1.5 text-sm">
                    {[
                      { label: "MyTax (LHDN income tax)", url: "https://mytax.hasil.gov.my" },
                      { label: "MySSTCustoms (SST registration & returns)", url: "https://mysst.customs.gov.my" },
                      { label: "i-Akaun KWSP (EPF)", url: "https://i-akaun.kwsp.gov.my" },
                      { label: "ASSIST PERKESO (SOCSO/EIS)", url: "https://assist.perkeso.gov.my" },
                      { label: "MyInvois (LHDN e-invoice)", url: "https://myinvois.hasil.gov.my" },
                    ].map(({ label, url }) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#D4AF37] hover:underline">
                          <span className="text-xs">↗</span>
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "preferences" && (
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-xl font-bold text-white">{t.settings.preferencesTitle}</h3>
                  <p className="text-sm text-gray-400">{t.settings.preferencesSubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handlePreferencesSave()}
                  disabled={prefPending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {t.settings.savePreferences}
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              {formSuccess && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{formSuccess}</div>
              )}

              <div className="max-w-md space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    <Globe className="mr-1.5 inline h-4 w-4" />
                    {t.settings.languageLabel}
                  </label>
                  <p className="mb-3 text-xs text-gray-500">{t.settings.languageHint}</p>

                  <div className="grid grid-cols-2 gap-3">
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
                      <div className="text-center">
                        <p className={`text-sm font-bold ${selectedLang === "ms" ? "text-[#D4AF37]" : "text-white"}`}>
                          {t.settings.languageBM}
                        </p>
                        <p className="text-[11px] text-gray-500">BM · Lalai</p>
                      </div>
                      {selectedLang === "ms" && (
                        <span className="rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold text-[#111]">
                          ✓ Dipilih
                        </span>
                      )}
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
                      <div className="text-center">
                        <p className={`text-sm font-bold ${selectedLang === "en" ? "text-[#D4AF37]" : "text-white"}`}>
                          {t.settings.languageEN}
                        </p>
                        <p className="text-[11px] text-gray-500">EN · Default</p>
                      </div>
                      {selectedLang === "en" && (
                        <span className="rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[10px] font-bold text-[#111]">
                          ✓ Selected
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
