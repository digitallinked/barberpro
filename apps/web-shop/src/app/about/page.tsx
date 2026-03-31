import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Heart,
  Lightbulb,
  MapPin,
  Scissors,
  Shield,
  Star,
  Target,
  Users
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "About Us | BarberPro.my",
  description:
    "Learn about BarberPro.my — Malaysia's premier barber shop management platform built by Malaysians, for Malaysian barbers."
};

const values = [
  {
    icon: Heart,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    title: "Built for Malaysian Barbers",
    description:
      "Every feature is designed around how Malaysian barber shops actually operate — from DuitNow QR payments to Bahasa-friendly interfaces."
  },
  {
    icon: Shield,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    title: "Trustworthy & Secure",
    description:
      "Your business data is encrypted and protected. We comply with Malaysia's Personal Data Protection Act 2010 (PDPA)."
  },
  {
    icon: Lightbulb,
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    title: "Always Improving",
    description:
      "We ship updates every week based on real feedback from barbers on the ground. Your suggestions shape our product roadmap."
  },
  {
    icon: Target,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    title: "Results-Driven",
    description:
      "Our customers report 30–50% reduction in admin time and significant increases in monthly revenue after switching to BarberPro.my."
  }
];

const milestones = [
  {
    year: "2022",
    title: "The Idea",
    description:
      "Our founder, frustrated by watching his uncle manage a bustling KL barber shop with a whiteboard and paper, decided there had to be a better way."
  },
  {
    year: "2023",
    title: "Beta Launch",
    description:
      "First 10 barber shops in Klang Valley tried BarberPro.my. The feedback was overwhelming — queue management and payroll were game-changers."
  },
  {
    year: "2024",
    title: "Rapid Growth",
    description:
      "Expanded to 200+ shops across Peninsular Malaysia. Launched DuitNow QR integration, multi-branch management, and advanced payroll features."
  },
  {
    year: "2025",
    title: "National Platform",
    description:
      "Reached Sabah and Sarawak. Became Malaysia's most-used barber management software with 500+ active shops and 2,000+ staff on the platform."
  }
];

const team = [
  {
    name: "Hafiz Rahman",
    role: "CEO & Co-Founder",
    bio: "Former software engineer at a major Malaysian bank. Passionate about empowering local SMEs with enterprise-grade tools.",
    initials: "HR"
  },
  {
    name: "Nurul Ain",
    role: "CTO & Co-Founder",
    bio: "Full-stack engineer with 8 years of experience building SaaS products. Previously led engineering at a Malaysian fintech startup.",
    initials: "NA"
  },
  {
    name: "Azri Yusof",
    role: "Head of Product",
    bio: "Obsessive about user experience. Spent years working with barbers directly to understand their daily pain points.",
    initials: "AY"
  },
  {
    name: "Faridah Ismail",
    role: "Head of Customer Success",
    bio: "Ensures every shop gets onboarded smoothly and gets maximum value from the platform. Your first point of contact.",
    initials: "FI"
  }
];

const stats = [
  { value: "500+", label: "Active Barber Shops" },
  { value: "2,000+", label: "Barbers on Platform" },
  { value: "13", label: "States Covered" },
  { value: "RM 50M+", label: "Transactions Processed" }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0d1013] py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
            <MapPin className="h-3 w-3" />
            Proudly Made in Malaysia
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            We&apos;re on a Mission to{" "}
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f5d06e] bg-clip-text text-transparent">
              Modernise Malaysian Barber Shops
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            BarberPro.my was born from a simple observation: Malaysia&apos;s barbers are world-class,
            but their business tools are not. We&apos;re changing that — one shop at a time.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/5 bg-[#13161a] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-[#d4af37] sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="bg-[#0d1013] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Our Story</span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                From a KL Barber Shop Whiteboard to a National Platform
              </h2>
              <p className="mt-4 text-base text-gray-400">
                It started when our founder visited his uncle&apos;s barber shop in Chow Kit. The shop was packed —
                12 customers waiting, two barbers flat out, and a handwritten queue on a whiteboard that kept
                getting erased. Payroll was done in Excel once a month. Customer records lived in a tattered notebook.
              </p>
              <p className="mt-4 text-base text-gray-400">
                We knew Malaysian barbers deserved better. Not some foreign software that doesn&apos;t understand
                DuitNow, doesn&apos;t speak Bahasa, and charges in USD. They needed something built specifically
                for how barber shops work in Malaysia.
              </p>
              <p className="mt-4 text-base text-gray-400">
                So we built it. BarberPro.my is that platform — complete, affordable, and proudly Malaysian.
              </p>
            </div>
            <div className="grid gap-4">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-4 rounded-2xl border border-white/5 bg-[#13161a] p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/20 text-sm font-black text-[#d4af37]">
                    {m.year}
                  </div>
                  <div>
                    <p className="font-bold text-white">{m.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">Our Values</span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">What We Stand For</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.iconBg} mb-5`}>
                  <v.icon className={`h-6 w-6 ${v.iconColor}`} />
                </div>
                <h3 className="font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="bg-[#0d1013] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">The Team</span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">The People Behind BarberPro.my</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              A small but mighty team of Malaysian builders obsessed with helping barbers succeed.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-white/5 bg-[#13161a] p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/20 text-lg font-black text-[#d4af37]">
                  {member.initials}
                </div>
                <p className="font-bold text-white">{member.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#d4af37]">{member.role}</p>
                <p className="mt-3 text-sm text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiring Banner ── */}
      <section className="bg-[#13161a] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/20 mb-6">
            <Users className="h-7 w-7 text-[#d4af37]" />
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Want to Join the Team?</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            We&apos;re always looking for passionate Malaysians who want to build something meaningful.
            Check out our open roles.
          </p>
          <Link
            href="/careers"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-8 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
          >
            View Open Roles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
