"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  DollarSign,
  Package,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
} from "lucide-react";

import { useT } from "@/lib/i18n/language-context";

// ─── Static Mock Screens (data is demo-only, no translation needed) ───────────

function QueueScreen() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between bg-black/60 px-4 py-3">
        <span className="text-xs font-semibold text-white">Queue Board</span>
        <span className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />Live
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[10px] font-bold text-black">A1</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Ahmad Razak</p>
            <p className="text-[10px] text-gray-400">Haircut + Wash • Barber Ali</p>
          </div>
          <span className="ml-auto shrink-0 text-xs font-bold text-green-400">Now</span>
        </div>
        {[
          { id: "A2", name: "Zulaikha", service: "Beard Trim • Barber Faiz", wait: "8 min" },
          { id: "A3", name: "Rayyan", service: "Fade Cut • Barber Haris", wait: "14 min" },
          { id: "A4", name: "Iskandar", service: "Hair + Styling", wait: "22 min" },
        ].map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">{c.id}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{c.name}</p>
              <p className="text-[10px] text-gray-400">{c.service}</p>
            </div>
            <span className="ml-auto shrink-0 text-xs text-gray-400">{c.wait}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-4 py-3">
        <span className="text-xs text-gray-400">4 customers waiting</span>
        <button type="button" className="rounded-md bg-[#d4af37] px-3 py-1 text-[11px] font-bold text-black">+ Add Walk-In</button>
      </div>
    </div>
  );
}

function POSScreen() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between bg-black/60 px-4 py-3">
        <span className="text-xs font-semibold text-white">POS · Checkout</span>
        <span className="text-xs text-gray-400">Customer #A21</span>
      </div>
      <div className="space-y-2 p-4">
        {[
          { label: "Haircut", price: "RM 25" },
          { label: "Hair Wash", price: "RM 10" },
          { label: "Pomade (Suavecito)", price: "RM 45" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
            <span className="text-xs text-white">{item.label}</span>
            <span className="text-xs font-semibold text-white">{item.price}</span>
          </div>
        ))}
        <div className="my-1 border-t border-white/10" />
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-gray-400">Subtotal</span>
          <span className="text-xs text-gray-400">RM 80</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-[#d4af37]">Member Discount (10%)</span>
          <span className="text-xs text-[#d4af37]">- RM 8</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[#d4af37]/10 px-3 py-2">
          <span className="text-sm font-bold text-white">Total</span>
          <span className="text-sm font-bold text-[#d4af37]">RM 72</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-white/5 bg-black/40 px-4 py-3">
        <button type="button" className="rounded-md bg-white/10 py-1.5 text-[11px] text-white">Cash</button>
        <button type="button" className="rounded-md bg-[#d4af37] py-1.5 text-[11px] font-bold text-black">DuitNow QR</button>
        <button type="button" className="rounded-md bg-white/10 py-1.5 text-[11px] text-white">Card</button>
      </div>
    </div>
  );
}

function PayrollScreen() {
  const staff = [
    { name: "Barber Ali", cuts: 18, commission: "RM 540", salary: "RM 800" },
    { name: "Barber Faiz", cuts: 14, commission: "RM 420", salary: "RM 800" },
    { name: "Barber Haris", cuts: 11, commission: "RM 330", salary: "RM 800" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between bg-black/60 px-4 py-3">
        <span className="text-xs font-semibold text-white">Payroll · March 2024</span>
        <span className="text-xs text-[#d4af37]">Auto-calculated</span>
      </div>
      <div className="space-y-2 p-4">
        {staff.map((s) => (
          <div key={s.name} className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{s.name}</span>
              <span className="text-xs font-bold text-[#d4af37]">{s.salary} + {s.commission}</span>
            </div>
            <div className="mt-1.5 flex gap-4">
              <span className="text-[10px] text-gray-400">{s.cuts} cuts</span>
              <span className="text-[10px] text-gray-400">Commission: {s.commission}</span>
              <span className="text-[10px] text-gray-400">Base: {s.salary}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-4 py-3">
        <span className="text-xs text-gray-400">3 staff • Total payout</span>
        <span className="text-xs font-bold text-white">RM 3,690</span>
      </div>
    </div>
  );
}

function InventoryScreen() {
  const items = [
    { name: "Pomade (Suavecito)", stock: 3, min: 5, status: "low" },
    { name: "Shaving Cream", stock: 12, min: 8, status: "ok" },
    { name: "Beard Oil", stock: 7, min: 5, status: "ok" },
    { name: "Barber Cape", stock: 2, min: 4, status: "low" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between bg-black/60 px-4 py-3">
        <span className="text-xs font-semibold text-white">Inventory</span>
        <span className="text-xs text-orange-400">2 low stock alerts</span>
      </div>
      <div className="space-y-2 p-4">
        {items.map((item) => (
          <div
            key={item.name}
            className={`flex items-center justify-between rounded-lg p-3 ${
              item.status === "low" ? "border border-red-500/30 bg-red-500/10" : "bg-white/5"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-white">{item.name}</p>
              <p className="text-[10px] text-gray-400">Min stock: {item.min}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${item.status === "low" ? "text-red-400" : "text-green-400"}`}>{item.stock}</p>
              <p className="text-[10px] text-gray-400">{item.status === "low" ? "⚠ Reorder" : "In stock"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111111] shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between bg-black/50 px-4 py-3">
        <span className="text-xs font-semibold text-white">Live Dashboard</span>
        <span className="flex items-center gap-1.5 text-xs text-[#d4af37]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />Online
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/5">
        {[
          { label: "Today's Revenue", value: "RM 2,450" },
          { label: "Walk-Ins", value: "38" },
          { label: "Queue Active", value: "7" },
          { label: "Avg Wait Time", value: "11 min" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111111] px-4 py-3">
            <p className="text-[10px] text-gray-500">{s.label}</p>
            <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Current Queue</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />A21 - Haircut + Wash
            </span>
            <span className="font-semibold text-[#d4af37]">Now</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>A22 - Beard Trim</span><span>8 min</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>A23 - Fade Cut</span><span>14 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section alternation ──────────────────────────────────────────────────────

const S_DARK = "bg-[#0d1013]";
const S_MID  = "bg-[#13161a]";

// ─── Page Component ───────────────────────────────────────────────────────────

export function MarketingPageContent() {
  const t = useT();
  const m = t.marketing;

  const featureCards = [
    { title: m.feat1Title, description: m.feat1Desc, icon: Timer, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
    { title: m.feat2Title, description: m.feat2Desc, icon: CreditCard, iconBg: "bg-green-500/20", iconColor: "text-green-400" },
    { title: m.feat3Title, description: m.feat3Desc, icon: DollarSign, iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
    { title: m.feat4Title, description: m.feat4Desc, icon: Package, iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
    { title: m.feat5Title, description: m.feat5Desc, icon: CalendarDays, iconBg: "bg-teal-500/20", iconColor: "text-teal-400" },
    { title: m.feat6Title, description: m.feat6Desc, icon: Users, iconBg: "bg-pink-500/20", iconColor: "text-pink-400" },
    { title: m.feat7Title, description: m.feat7Desc, icon: BarChart2, iconBg: "bg-yellow-500/20", iconColor: "text-yellow-400" },
    { title: m.feat8Title, description: m.feat8Desc, icon: Building2, iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400" },
  ];

  const queueDetails = [
    { title: m.queue1Title, text: m.queue1Text },
    { title: m.queue2Title, text: m.queue2Text },
    { title: m.queue3Title, text: m.queue3Text },
  ];

  const posDetails = [
    { title: m.pos1Title, text: m.pos1Text },
    { title: m.pos2Title, text: m.pos2Text },
    { title: m.pos3Title, text: m.pos3Text },
  ];

  const payrollDetails = [
    { title: m.payroll1Title, text: m.payroll1Text },
    { title: m.payroll2Title, text: m.payroll2Text },
    { title: m.payroll3Title, text: m.payroll3Text },
  ];

  const inventoryDetails = [
    { title: m.inv1Title, text: m.inv1Text },
    { title: m.inv2Title, text: m.inv2Text },
    { title: m.inv3Title, text: m.inv3Text },
  ];

  const branchStats = [
    { name: "KL Sentral HQ", sales: "RM 45,200", expenses: "RM 1,500", staff: 8 },
    { name: "Bangsar Branch", sales: "RM 28,450", expenses: "RM 950", staff: 5 },
    { name: "TTDI Branch", sales: "RM 15,100", expenses: "RM 500", staff: 3 },
  ];

  const testimonials = [
    {
      quote: "Before BarberPro.my, I was spending 3 hours every week calculating barber commissions in Excel. Now it's automatic. Game changer for my business.",
      author: "Ahmad Razak",
      role: "Owner, Razak's Barbershop KL",
      initials: "AR",
    },
    {
      quote: "Queue management is brilliant. Customers love seeing the queue on TV and my barbers can focus on cutting hair instead of managing walk-ins.",
      author: "Zack Ibrahim",
      role: "Manager, Urban Cuts Bangsar",
      initials: "ZI",
    },
    {
      quote: "I run 4 branches and BarberPro.my helps me see everything in one dashboard. Sales, staff performance, inventory, all real-time. Worth every ringgit.",
      author: "Muthu Kumar",
      role: "Owner, Kumar's Barber Empire",
      initials: "MK",
    },
  ];

  const pricing = [
    {
      name: m.pricingStarterName,
      price: "RM 69",
      note: m.pricingStarterNote,
      features: [m.pricingF1, m.pricingF2, m.pricingF3, m.pricingF4, m.pricingF5, m.pricingF6, m.pricingF7, m.pricingF8],
      featured: false,
    },
    {
      name: m.pricingProName,
      price: "RM 179",
      note: m.pricingProNote,
      features: [m.pricingP1, m.pricingP2, m.pricingP3, m.pricingP4, m.pricingP5, m.pricingP6],
      featured: true,
    },
    {
      name: m.pricingEntName,
      price: m.pricingCustom,
      note: m.pricingEntNote,
      features: [m.pricingE1, m.pricingE2, m.pricingE3, m.pricingE4, m.pricingE5, m.pricingE6],
      featured: false,
    },
  ];

  const faqItems = [
    { q: m.faq1Q, a: m.faq1A },
    { q: m.faq2Q, a: m.faq2A },
    { q: m.faq3Q, a: m.faq3A },
    { q: m.faq4Q, a: m.faq4A },
    { q: m.faq5Q, a: m.faq5A },
    { q: m.faq6Q, a: m.faq6A },
    { q: m.faq7Q, a: m.faq7A },
    { q: m.faq8Q, a: m.faq8A },
  ];

  const footerGroups = [
    {
      title: m.footerProduct,
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Demo", href: "/dashboard" },
        { label: "Updates", href: "/updates" },
      ],
    },
    {
      title: m.footerCompany,
      links: [
        { label: "About Us", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: m.footerSupport,
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Documentation", href: "/help" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <main className="bg-[#0d1013] text-gray-100 antialiased">
      {/* ── Hero ── */}
      <section className={`${S_DARK} relative overflow-hidden`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.10),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
              <Sparkles className="h-3 w-3" />
              {m.heroBadge}
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              {m.heroTitle}{" "}
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f5d06e] bg-clip-text text-transparent">
                {m.heroHighlight}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-gray-400">{m.heroDesc}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110">
                {m.heroCta1}
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white">
                <Play className="h-4 w-4" /> {m.heroCta2}
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-[#d4af37]" />
              {m.heroNote}
            </p>
          </div>
          <HeroDashboard />
        </div>
      </section>

      {/* ── Everything You Need ── */}
      <section id="features" className={`${S_MID} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.featuresTitle}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-400">{m.featuresDesc}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} mb-5`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Queue ── */}
      <section id="queue" className={`${S_DARK} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <QueueScreen />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">{m.queueBadge}</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.queueTitle}</h2>
              <p className="mt-4 text-lg text-gray-400">{m.queueDesc}</p>
              <ul className="mt-8 space-y-4">
                {queueDetails.map((d) => (
                  <li key={d.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-500/20">
                      <Check className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{d.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── POS ── */}
      <section id="pos" className={`${S_MID} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <span className="text-xs font-bold uppercase tracking-wider text-green-500">{m.posBadge}</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.posTitle}</h2>
              <p className="mt-4 text-lg text-gray-400">{m.posDesc}</p>
              <ul className="mt-8 space-y-4">
                {posDetails.map((d) => (
                  <li key={d.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-500/20">
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{d.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <POSScreen />
            </div>
          </div>
        </div>
      </section>

      {/* ── Payroll ── */}
      <section id="payroll" className={`${S_DARK} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <PayrollScreen />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{m.payrollBadge}</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.payrollTitle}</h2>
              <p className="mt-4 text-lg text-gray-400">{m.payrollDesc}</p>
              <ul className="mt-8 space-y-4">
                {payrollDetails.map((d) => (
                  <li key={d.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500/20">
                      <Check className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{d.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inventory ── */}
      <section id="inventory" className={`${S_MID} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-500">{m.inventoryBadge}</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.inventoryTitle}</h2>
              <p className="mt-4 text-lg text-gray-400">{m.inventoryDesc}</p>
              <ul className="mt-8 space-y-4">
                {inventoryDetails.map((d) => (
                  <li key={d.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-500/20">
                      <Check className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{d.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">{d.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <InventoryScreen />
            </div>
          </div>
        </div>
      </section>

      {/* ── Branches ── */}
      <section id="branches" className={`${S_DARK} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.branchesTitle}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-400">{m.branchesDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {branchStats.map((branch) => (
              <article key={branch.name} className="overflow-hidden rounded-2xl border border-white/5 bg-[#111111]">
                <div className="flex items-center justify-between bg-black/50 px-4 py-3">
                  <h4 className="text-base font-bold text-white">{branch.name}</h4>
                  <span className="text-xs text-gray-400">{branch.staff} staff</span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="text-sm text-gray-400">Monthly Sales</span>
                    <span className="text-sm font-bold text-white">{branch.sales}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                    <span className="text-sm text-gray-400">Expenses</span>
                    <span className="text-sm font-bold text-white">{branch.expenses}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-2.5">
                    <span className="text-sm text-[#d4af37]">Net Profit</span>
                    <span className="text-sm font-bold text-[#d4af37]">
                      {`RM ${(parseInt(branch.sales.replace(/[^0-9]/g, "")) - parseInt(branch.expenses.replace(/[^0-9]/g, ""))).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={`${S_MID} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.testimonialsTitle}</h2>
            <p className="mt-4 text-lg text-gray-400">{m.testimonialsDesc}</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <article key={t.author} className="flex flex-col rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <div className="mb-4 flex gap-1 text-[#d4af37]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="flex-1 leading-relaxed text-gray-300">&quot;{t.quote}&quot;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#d4af37] bg-[#d4af37]/20 text-sm font-bold text-[#d4af37]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-white">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className={`${S_DARK} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.pricingTitle}</h2>
            <p className="mt-4 text-lg text-gray-400">{m.pricingDesc}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pricing.map((tier) => (
              <article
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  tier.featured
                    ? "border-2 border-[#d4af37] bg-[#1a1600]"
                    : "border border-white/5 bg-[#111111]"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#d4af37] px-4 py-1 text-xs font-bold text-black">
                      {m.mostPopular}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{tier.note}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{tier.price}</span>
                  {tier.price !== m.pricingCustom && (
                    <span className="mb-1 text-sm text-gray-400">{m.pricingMonthly}</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="h-4 w-4 shrink-0 text-[#d4af37]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold transition ${
                    tier.featured
                      ? "bg-[#d4af37] text-black hover:brightness-110"
                      : "border border-white/10 text-white hover:bg-white/5"
                  }`}
                >
                  {tier.price === m.pricingCustom ? m.contactSales : m.startFreeTrial}
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">{m.pricingNote}</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className={`${S_MID} py-20`}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.faqTitle}</h2>
            <p className="mt-4 text-lg text-gray-400">{m.faqDesc}</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <h4 className="text-lg font-bold text-white">{item.q}</h4>
                <p className="mt-2 text-gray-400">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={`${S_DARK} py-20`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#1a1400] to-[#0d0d0d] px-8 py-16 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{m.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">{m.ctaDesc}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-8 py-3.5 text-sm font-bold text-black transition hover:brightness-110">
                {m.ctaCta1} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-8 py-3.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white">
                <ChevronRight className="h-4 w-4" /> {m.ctaCta2}
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">{m.ctaNote}</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-[#0a0c0f]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <p className="text-base font-bold text-white">
                BarberPro<span className="text-[#d4af37]">.my</span>
              </p>
              <p className="mt-3 max-w-xs text-sm text-gray-400">{m.footerDesc}</p>
            </div>
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 font-bold text-white">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-400 transition hover:text-[#d4af37]">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} barberpro.my. All rights reserved.</p>
          <p className="mt-1">
            Made with <span className="text-red-500">♥</span> in Malaysia &nbsp;|&nbsp;{" "}
            <Link href="/terms" className="transition hover:text-gray-400">Terms</Link>{" "}·{" "}
            <Link href="/privacy" className="transition hover:text-gray-400">Privacy</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
