import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock, Heart, MapPin, Monitor, Zap } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Careers | BarberPro.my",
  description:
    "Join the BarberPro.my team and help modernise Malaysian barber shops. View open roles and apply today."
};

const perks = [
  {
    icon: Monitor,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    title: "Remote-First",
    description:
      "Work from anywhere in Malaysia. We believe great work happens when people are comfortable and focused."
  },
  {
    icon: Zap,
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    title: "Fast-Moving Team",
    description:
      "No bureaucracy. Ship real features used by real barbers every week. Your work has immediate impact."
  },
  {
    icon: Heart,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    title: "Meaningful Mission",
    description:
      "We're not building another social app. We're helping thousands of Malaysian barbers earn more and stress less."
  },
  {
    icon: Briefcase,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    title: "Competitive Package",
    description:
      "Market-rate salary, equity options, medical cover, and annual learning & development budget."
  }
];

const openRoles = [
  {
    id: "senior-fullstack",
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    type: "Full-Time",
    location: "Remote (Malaysia)",
    description:
      "We're looking for a senior engineer to help scale our Next.js + Supabase platform to 1,000+ shops. You'll own end-to-end features from database design to UI.",
    requirements: [
      "5+ years of experience with React and Node.js or similar",
      "Strong TypeScript skills",
      "Experience with PostgreSQL or similar relational databases",
      "Comfortable with CI/CD, containerisation, and cloud infrastructure",
      "Able to communicate in Bahasa Malaysia and English"
    ]
  },
  {
    id: "product-designer",
    title: "Product Designer (UI/UX)",
    department: "Design",
    type: "Full-Time",
    location: "Remote (Malaysia)",
    description:
      "We need a designer who obsesses over simplicity. Our users are barbers — not techies. Every screen you design must be intuitive enough that a first-time user gets it immediately.",
    requirements: [
      "3+ years of product design experience for web and mobile",
      "Strong Figma skills",
      "Experience conducting user research and usability testing",
      "Portfolio demonstrating clean, functional UI design",
      "Understanding of local user behaviours and preferences"
    ]
  },
  {
    id: "growth-marketing",
    title: "Growth & Marketing Manager",
    department: "Marketing",
    type: "Full-Time",
    location: "Kuala Lumpur / Remote",
    description:
      "Own our customer acquisition strategy. From WhatsApp campaigns to barber trade show activations — you'll find the channels that bring shops onto BarberPro.my.",
    requirements: [
      "3+ years in B2B SaaS marketing or growth",
      "Track record of driving measurable pipeline",
      "Comfortable with both digital and on-the-ground marketing",
      "Strong written and verbal communication in BM and English",
      "Data-driven with experience in analytics tools"
    ]
  },
  {
    id: "customer-success",
    title: "Customer Success Executive",
    department: "Customer Success",
    type: "Full-Time",
    location: "Kuala Lumpur / Remote",
    description:
      "Help our barber shops get the most out of BarberPro.my. You'll onboard new subscribers, run training sessions over WhatsApp or video call, and ensure every shop loves the product.",
    requirements: [
      "1–3 years in customer success, account management, or support",
      "Excellent interpersonal and communication skills",
      "Patient and empathetic — you're dealing with busy shop owners",
      "Fluent in Bahasa Malaysia and English",
      "Experience with SaaS products is a plus"
    ]
  }
];

const values = [
  "We ship things that matter, not things that look impressive in demos.",
  "We treat every barber shop like our first customer.",
  "We write things down and communicate openly.",
  "We own our mistakes and fix them fast.",
  "We celebrate wins together, no matter how small."
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0d1013] py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
            We&apos;re Hiring
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Help Us Build the{" "}
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f5d06e] bg-clip-text text-transparent">
              Future of Barber Shops
            </span>{" "}
            in Malaysia
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
            We&apos;re a small team with a big mission. If you care about building real products for real
            people — and want your work to matter — you&apos;ll fit right in.
          </p>
        </div>
      </section>

      {/* ── Perks ── */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black text-white sm:text-3xl">Why Work at BarberPro.my?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${perk.iconBg} mb-5`}>
                  <perk.icon className={`h-6 w-6 ${perk.iconColor}`} />
                </div>
                <h3 className="font-bold text-white">{perk.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-[#0d1013] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-black text-white">How We Work</h2>
          <div className="space-y-3">
            {values.map((v, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#13161a] p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/20 text-xs font-black text-[#d4af37]">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Roles ── */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-white sm:text-3xl">Open Roles</h2>
            <p className="mt-2 text-gray-400">
              {openRoles.length} positions available &mdash; all remote-friendly unless stated.
            </p>
          </div>
          <div className="space-y-5">
            {openRoles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#d4af37]/10 px-2.5 py-0.5 text-xs font-semibold text-[#d4af37]">
                        {role.department}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> {role.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {role.location}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-white">{role.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{role.description}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Requirements</p>
                  <ul className="space-y-1">
                    {role.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="mt-0.5 text-[#d4af37]">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5">
                  <a
                    href={`mailto:careers@barberpro.my?subject=Application: ${encodeURIComponent(role.title)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
                  >
                    Apply for This Role <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 text-center">
            <p className="font-bold text-white">Don&apos;t See Your Role?</p>
            <p className="mt-2 text-sm text-gray-400">
              We&apos;re always open to exceptional people. Send your CV and a note about what
              you&apos;d like to work on.
            </p>
            <a
              href="mailto:careers@barberpro.my?subject=General Application"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              Send a General Application
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
