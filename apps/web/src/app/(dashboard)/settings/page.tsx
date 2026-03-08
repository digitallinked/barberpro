"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Save, Search, Shield } from "lucide-react";
import { useTenant } from "@/components/tenant-provider";
import { useTenantProfile } from "@/hooks";
import { updateTenantProfile, changePassword } from "@/actions/settings";

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

const NAV_ITEMS = [
  { id: "profile", label: "Business Profile", icon: Building2 },
  { id: "security", label: "Security", icon: Shield }
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const tenant = useTenant();
  const { data: profileResult } = useTenantProfile();

  const [activeSection, setActiveSection] = useState("profile");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
      setFormSuccess("Profile updated successfully.");
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
      setFormSuccess("Password changed successfully.");
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to change password");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your business configuration</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search settings..."
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
                  <h3 className="mb-1 text-xl font-bold text-white">Business Profile</h3>
                  <p className="text-sm text-gray-400">Update your business information</p>
                </div>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save Changes
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
                    label="Business Name"
                    name="name"
                    value={profile?.name ?? tenant.tenantName ?? ""}
                    placeholder="Enter business name"
                  />
                  <FormField
                    label="Registration Number (SSM)"
                    name="registration_number"
                    value={profile?.registration_number ?? ""}
                    placeholder="SSM Number"
                  />
                </div>

                <FormField
                  label="Address Line 1"
                  name="address_line1"
                  value={profile?.address_line1 ?? ""}
                  placeholder="Full address"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="City"
                    name="city"
                    value={profile?.city ?? ""}
                    placeholder="City"
                  />
                  <FormField
                    label="Postcode"
                    name="postcode"
                    value={profile?.postcode ?? ""}
                    placeholder="Postcode"
                  />
                  <FormField
                    label="State"
                    name="state"
                    value={profile?.state ?? ""}
                    placeholder="State"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={profile?.phone ?? ""}
                    placeholder="+60"
                  />
                  <FormField
                    label="Email"
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
                <h3 className="mb-1 text-xl font-bold text-white">Security</h3>
                <p className="text-sm text-gray-400">Change your password</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                {formError && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
                )}
                {formSuccess && (
                  <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{formSuccess}</div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">New Password</label>
                  <input
                    name="new_password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Confirm Password</label>
                  <input
                    name="confirm_password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Change Password
                </button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
