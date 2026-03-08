"use client";

import {
  Bell,
  Building2,
  CreditCard,
  Globe,
  ImageIcon,
  Save,
  Scissors,
  Search,
  Shield,
  Users,
  Zap
} from "lucide-react";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "profile",       label: "Business Profile",     icon: Building2 },
  { id: "branches",      label: "Branches",             icon: Globe },
  { id: "services",      label: "Services & Pricing",   icon: Scissors },
  { id: "roles",         label: "Staff Roles",          icon: Users },
  { id: "notifications", label: "Notifications",        icon: Bell },
  { id: "integrations",  label: "Integrations",         icon: Zap },
  { id: "billing",       label: "Billing",              icon: CreditCard }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function FormField({ label, type = "text", value = "", placeholder = "" }: { label: string; type?: string; value?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your business configuration</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search settings..." className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <Card className="p-3">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
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

        {/* Main content */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Business Profile</h3>
                <p className="text-sm text-gray-400">Update your business information and branding</p>
              </div>
              <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Business Name" value="BarberPro KL" placeholder="Enter business name" />
                <FormField label="Registration Number (SSM)" value="202301234567" placeholder="SSM Number" />
              </div>

              <FormField label="Business Address" value="Lot G-01, KL Sentral Station, 50470 KL" placeholder="Full address" />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Phone Number" type="tel" value="+60 12-345 6789" placeholder="+60" />
                <FormField label="Email" type="email" value="info@barberpro.my" placeholder="email@example.com" />
              </div>

              {/* Logo upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Business Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-[#111]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                      <Scissors className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                  </div>
                  <div>
                    <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white transition hover:bg-[#333]">
                      <ImageIcon className="h-4 w-4" /> Upload Logo
                    </button>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Operating hours */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-300">Operating Hours</label>
                <div className="space-y-2">
                  {["Monday - Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="flex items-center gap-3 rounded-lg bg-[#111] px-4 py-3 text-sm">
                      <span className="w-40 text-gray-300">{day}</span>
                      <input type="text" defaultValue={day === "Sunday" ? "Closed" : "09:00"} className="w-20 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-center text-xs text-white" />
                      {day !== "Sunday" && (
                        <>
                          <span className="text-gray-500">to</span>
                          <input type="text" defaultValue={day === "Saturday" ? "18:00" : "21:00"} className="w-20 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-center text-xs text-white" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-300">Security</label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-[#111] px-4 py-3">
                    <div>
                      <p className="text-sm text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Extra security for your account</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-[#D4AF37] p-0.5 cursor-pointer">
                      <div className="h-5 w-5 translate-x-5 rounded-full bg-white transition" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#111] px-4 py-3">
                    <div>
                      <p className="text-sm text-white">Session Timeout</p>
                      <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
                    </div>
                    <select className="rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-xs text-white outline-none">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
