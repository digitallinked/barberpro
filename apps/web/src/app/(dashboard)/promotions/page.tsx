"use client";

import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Gift,
  Mail,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Users,
  X
} from "lucide-react";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Active Campaigns", value: "12", icon: Megaphone, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { label: "Customers Reached", value: "2,458", icon: Users, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { label: "Total Redeemed", value: "1,234", icon: Gift, iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
  { label: "Conversion Rate", value: "18.5%", icon: TrendingUp, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]" }
];

const TEMPLATES = [
  { name: "Birthday Wishes", desc: "Auto-send birthday discount to customers", icon: Gift, color: "text-pink-400" },
  { name: "Inactive Customers", desc: "Win back customers who haven't visited in 30 days", icon: Users, color: "text-blue-400" },
  { name: "Student Promotion", desc: "Special rates for students with valid ID", icon: Star, color: "text-emerald-400" },
  { name: "Ramadan Special", desc: "Festive season promotions and bundles", icon: Megaphone, color: "text-[#D4AF37]" }
];

const CAMPAIGNS = [
  { name: "Hari Raya Special Package", status: "Active", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", reach: "456 reached", redeemed: "89 redeemed", period: "Apr 1 - Apr 30" },
  { name: "Weekend Flash Sale", status: "Active", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", reach: "1,200 reached", redeemed: "340 redeemed", period: "Every Sat-Sun" },
  { name: "First-Time Customer Offer", status: "Draft", badge: "bg-gray-500/10 text-gray-400 border-gray-500/20", reach: "Not started", redeemed: "-", period: "Pending launch" }
];

const SCHEDULED = [
  { name: "Birthday Campaign", time: "Daily at 9:00 AM", target: "Birthday customers" },
  { name: "Weekend Promo", time: "Every Friday 6:00 PM", target: "All customers" },
  { name: "Inactive Winback", time: "Monthly, 1st", target: "30+ days inactive" }
];

const AUDIENCE = [
  { label: "All Customers", count: 1247 },
  { label: "VIP Members", count: 89 },
  { label: "New (< 30 days)", count: 156 },
  { label: "Inactive (30+ days)", count: 234 }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export default function PromotionsPage() {
  const [filter, setFilter] = useState("All");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Promotions &amp; Marketing</h2>
          <p className="mt-1 text-sm text-gray-400">Create campaigns, send messages and grow your business</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
          <Plus className="h-4 w-4" /> Create Campaign
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{s.value}</h3>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quick campaign templates */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Quick Campaign Templates</h3>
              <button type="button" className="text-sm font-medium text-[#D4AF37]">View All</button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.name} className="group rounded-lg border border-white/5 bg-[#111] p-4 transition hover:border-[#D4AF37]/20">
                    <Icon className={`mb-2 h-5 w-5 ${t.color}`} />
                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-[#D4AF37] transition">{t.name}</h4>
                    <p className="text-xs text-gray-500 mb-3">{t.desc}</p>
                    <button type="button" className="flex items-center gap-1 text-xs font-medium text-[#D4AF37]">
                      Setup <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active campaigns */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Active Campaigns</h3>
              <div className="flex gap-1">
                {["All", "Scheduled", "Draft"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      filter === f ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {CAMPAIGNS.map((c) => (
                <div key={c.name} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{c.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{c.reach}</span>
                      <span>{c.redeemed}</span>
                      <span>{c.period}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${c.badge}`}>{c.status}</span>
                    <button type="button" className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-medium text-[#D4AF37]">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Audience targeting */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-[#D4AF37]" /> Audience Targeting</h3>
            <div className="space-y-2">
              {AUDIENCE.map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-lg bg-[#111] px-3 py-2.5 text-sm">
                  <span className="text-gray-300">{a.label}</span>
                  <span className="font-bold text-white">{a.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2 text-sm font-bold text-[#111]">
              <Send className="h-4 w-4" /> Send Campaign
            </button>
          </Card>

          {/* WhatsApp reminders */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-400" /> WhatsApp Reminders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-[#111] px-3 py-2.5">
                <div><p className="text-sm text-white">Appointment Reminders</p><p className="text-xs text-gray-500">24h before appointment</p></div>
                <div className="h-5 w-9 rounded-full bg-emerald-500 p-0.5 cursor-pointer"><div className="h-4 w-4 translate-x-4 rounded-full bg-white" /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#111] px-3 py-2.5">
                <div><p className="text-sm text-white">Queue Notifications</p><p className="text-xs text-gray-500">When turn is near</p></div>
                <div className="h-5 w-9 rounded-full bg-emerald-500 p-0.5 cursor-pointer"><div className="h-4 w-4 translate-x-4 rounded-full bg-white" /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#111] px-3 py-2.5">
                <div><p className="text-sm text-white">Review Request</p><p className="text-xs text-gray-500">After service completion</p></div>
                <div className="h-5 w-9 rounded-full bg-[#2a2a2a] p-0.5 cursor-pointer"><div className="h-4 w-4 rounded-full bg-gray-500" /></div>
              </div>
            </div>
          </Card>

          {/* Message preview */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Message Preview</h3>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-gray-400 mb-1">WhatsApp Preview</p>
              <p className="text-sm text-white">Hi <span className="text-[#D4AF37]">&#123;name&#125;</span>! 🎉 Enjoy <span className="font-bold">20% off</span> your next visit at BarberPro KL Sentral. Valid until end of month. Book now!</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="rounded-lg border border-white/10 py-2 text-sm font-medium text-white hover:bg-white/5">Edit Template</button>
              <button type="button" className="rounded-lg bg-[#D4AF37] py-2 text-sm font-bold text-[#111]">Send Preview</button>
            </div>
          </Card>

          {/* Scheduled */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Scheduled</h3>
            <div className="space-y-3">
              {SCHEDULED.map((s) => (
                <div key={s.name} className="rounded-lg border border-white/5 bg-[#111] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-[#D4AF37]">Edit</button>
                      <button type="button" className="text-xs text-red-400">Cancel</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" /> {s.time}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.target}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
