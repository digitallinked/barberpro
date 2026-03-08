"use client";

import {
  ChevronRight,
  Gift,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  Star,
  Target,
  Users
} from "lucide-react";

// ─── Placeholder stats ────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Active Campaigns",
    value: "0",
    icon: Megaphone,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400"
  },
  {
    label: "Total Reach",
    value: "0",
    icon: Users,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400"
  },
  {
    label: "Messages Sent",
    value: "0",
    icon: Send,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400"
  }
];

const TEMPLATES = [
  {
    name: "Birthday Wishes",
    desc: "Auto-send birthday discount to customers",
    icon: Gift,
    color: "text-pink-400"
  },
  {
    name: "Inactive Customers",
    desc: "Win back customers who haven't visited in 30 days",
    icon: Users,
    color: "text-blue-400"
  },
  {
    name: "Student Promotion",
    desc: "Special rates for students with valid ID",
    icon: Star,
    color: "text-emerald-400"
  },
  {
    name: "Ramadan Special",
    desc: "Festive season promotions and bundles",
    icon: Megaphone,
    color: "text-[#D4AF37]"
  }
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>
  );
}

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Promotions &amp; Campaigns</h2>
          <p className="mt-1 text-sm text-gray-400">
            Create campaigns, send messages and grow your business
          </p>
        </div>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/50 px-4 py-2 text-sm font-bold text-[#111] cursor-not-allowed opacity-70"
        >
          <Plus className="h-4 w-4" /> Create Campaign
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {s.label}
                </p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}>
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{s.value}</h3>
            </Card>
          );
        })}
      </div>

      {/* Info message */}
      <Card className="border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <Megaphone className="h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <h3 className="font-bold text-white">Promotions Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-400">
              No promotions table configured yet. This feature will be available after setting up
              the promotions schema.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quick campaign templates */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Quick Campaign Templates</h3>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.name}
                    className="group rounded-lg border border-white/5 bg-[#111] p-4 transition hover:border-[#D4AF37]/20 opacity-75"
                  >
                    <Icon className={`mb-2 h-5 w-5 ${t.color}`} />
                    <h4 className="mb-1 text-sm font-bold text-white transition group-hover:text-[#D4AF37]">
                      {t.name}
                    </h4>
                    <p className="mb-3 text-xs text-gray-500">{t.desc}</p>
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 cursor-not-allowed"
                    >
                      Setup <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Audience targeting */}
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
              <Target className="h-4 w-4 text-[#D4AF37]" /> Audience Targeting
            </h3>
            <p className="text-sm text-gray-500">Configure after promotions schema is set up.</p>
            <button
              type="button"
              disabled
              className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#D4AF37]/30 py-2 text-sm font-bold text-[#111] opacity-60"
            >
              <Send className="h-4 w-4" /> Send Campaign
            </button>
          </Card>

          {/* WhatsApp reminders */}
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
              <MessageCircle className="h-4 w-4 text-emerald-400" /> WhatsApp Reminders
            </h3>
            <p className="text-sm text-gray-500">Coming soon with promotions.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
