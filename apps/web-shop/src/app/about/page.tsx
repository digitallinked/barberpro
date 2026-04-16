import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Lightbulb,
  MapPin,
  Scissors,
  Shield,
  Smartphone,
  Users,
  Zap
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/lib/seo";

const ABOUT_TITLE = "About Us | BarberPro.my";
const ABOUT_DESC =
  "BarberPro.my is a Malaysian-built barber shop management platform. Learn what we're building and why.";

export const metadata = marketingPageMetadata("/about", ABOUT_TITLE, ABOUT_DESC);

const values = [
  {
    icon: Heart,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    title: "Built for This Market",
    description:
      "Not a foreign product reskinned for Malaysia. Every feature is designed around how local barber shops actually work, from Ringgit pricing to Bahasa-friendly interfaces."
  },
  {
    icon: Shield,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    title: "Data You Can Trust",
    description:
      "Your customer records, payroll figures, and business data are encrypted and stored securely. We comply with Malaysia's Personal Data Protection Act 2010 (PDPA)."
  },
  {
    icon: Lightbulb,
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    title: "Shipping Continuously",
    description:
      "We release updates regularly and our roadmap is shaped by real barber shop operators. If something doesn't work for you, we want to know."
  },
  {
    icon: Zap,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    title: "Simple by Default",
    description:
      "Powerful tools don't have to be complicated. We cut the clutter so barbers can focus on their craft, not on learning software."
  }
];

const features = [
  "Walk-in queue management with live display board",
  "Appointment booking for repeat customers",
  "Commission-based payroll calculation",
  "Daily and monthly sales reporting",
  "Multi-barber and multi-branch support",
  "WhatsApp-ready customer notifications",
  "DuitNow QR and cash payment tracking",
  "Staff attendance and performance tracking"
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d1013] py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
            <MapPin className="h-3 w-3" />
            Proudly Made in Malaysia
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Built Specifically for{" "}
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f5d06e] bg-clip-text text-transparent">
              Malaysian Barber Shops
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            BarberPro.my is an all-in-one management platform built from the ground up for the way
            Malaysian barber shops operate. No workarounds. No foreign currency. No unnecessary
            complexity.
          </p>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                The Problem We Saw
              </span>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Great Barbers, Outdated Tools
              </h2>
              <p className="mt-4 text-base text-gray-400">
                Walk into most barber shops in Malaysia today and you'll still find the same
                setup: a whiteboard for queues, a notebook for customer records, and a group chat
                for staff scheduling. It works, until it doesn't.
              </p>
              <p className="mt-4 text-base text-gray-400">
                The software options that exist are either too generic to be useful, too expensive
                to justify, or built for markets that don't look anything like ours. DuitNow,
                commission splits, walk-in culture, multi-language staff. None of that comes out
                of the box elsewhere.
              </p>
              <p className="mt-4 text-base text-gray-400">
                So we built something that does. BarberPro.my handles the business side so barbers
                can focus on what they actually do well.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0d1013] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/20">
                  <Scissors className="h-5 w-5 text-[#d4af37]" />
                </div>
                <div>
                  <p className="font-bold text-white">What BarberPro.my covers</p>
                  <p className="text-xs text-gray-500">Everything under one login</p>
                </div>
              </div>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#0d1013] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Our Values
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">What We Stand For</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              These aren't wall posters. They're the decisions we make every time we build a new
              feature or respond to a support request.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/5 bg-[#13161a] p-6">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.iconBg} mb-5`}
                >
                  <v.icon className={`h-6 w-6 ${v.iconColor}`} />
                </div>
                <h3 className="font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Who It's For
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Built for Every Kind of Shop
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#0d1013] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20">
                <Scissors className="h-6 w-6 text-[#d4af37]" />
              </div>
              <h3 className="font-bold text-white">Solo Barbers</h3>
              <p className="mt-2 text-sm text-gray-400">
                Running a one-chair shop? You still need to track income, manage your schedule,
                and keep customers coming back. BarberPro.my keeps it lightweight and useful
                without overwhelming you.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0d1013] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20">
                <Users className="h-6 w-6 text-[#d4af37]" />
              </div>
              <h3 className="font-bold text-white">Growing Teams</h3>
              <p className="mt-2 text-sm text-gray-400">
                When you have three or four barbers on the floor, queue management and fair
                payroll splits start to matter. We handle both so there's no confusion at the
                end of the month.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0d1013] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20">
                <Smartphone className="h-6 w-6 text-[#d4af37]" />
              </div>
              <h3 className="font-bold text-white">Multi-Branch Owners</h3>
              <p className="mt-2 text-sm text-gray-400">
                Manage multiple locations from a single dashboard. Compare branch performance,
                standardise your services, and keep full visibility across your whole operation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d1013] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-8 py-14">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Give It a Try, No Commitment Needed
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              Start your free trial today. No credit card required, no long contracts.
              If it's not the right fit, you haven't lost anything.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-8 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
