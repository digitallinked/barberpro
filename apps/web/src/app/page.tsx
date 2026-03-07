import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/constants";

const coreHighlights = [
  { label: "Daily Active Shops", value: "120+" },
  { label: "Avg. Queue Reduction", value: "38%" },
  { label: "Payment Reconciliation", value: "99.9%" }
];

const featureCards = [
  {
    title: "Live Queue Board",
    description: "Manage walk-ins and appointments in one unified service flow.",
    icon: Clock3
  },
  {
    title: "Smart POS + Checkout",
    description: "Fast cashier workflow with service bundles and add-ons.",
    icon: CircleDollarSign
  },
  {
    title: "Barber Performance",
    description: "Track commission, upsells, and daily productivity.",
    icon: BarChart3
  },
  {
    title: "Customer CRM",
    description: "Retention workflows, visit history, and personalized service notes.",
    icon: Users
  },
  {
    title: "Appointments + Walk-ins",
    description: "Balanced schedule engine for online booking and in-store traffic.",
    icon: CalendarClock
  },
  {
    title: "Role-Based Access",
    description: "Secure permissions for owners, managers, cashiers, and staff.",
    icon: ShieldCheck
  }
];

const pricingTiers = [
  {
    name: "Starter",
    price: "RM 99",
    note: "per branch / month",
    points: ["Queue + POS", "Basic CRM", "Daily sales reports"]
  },
  {
    name: "Growth",
    price: "RM 199",
    note: "per branch / month",
    points: ["Everything in Starter", "Payroll + commission", "Inventory + expenses"],
    featured: true
  },
  {
    name: "Scale",
    price: "Custom",
    note: "multi-branch pricing",
    points: ["Everything in Growth", "Advanced analytics", "Priority onboarding"]
  }
];

const faqs = [
  {
    q: "Is this built for Malaysian barber shops?",
    a: "Yes. The workflows, pricing mindset, and operations structure are designed for local barber business models."
  },
  {
    q: "Can I manage multiple branches?",
    a: "Yes, branch-level visibility is a first-class concept in the platform architecture."
  },
  {
    q: "Do I need all modules from day one?",
    a: "No. You can start with operations essentials and expand progressively."
  }
];

export default function AppRootPage() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <header className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
              href="/dashboard"
            >
              Start Free Trial
            </Link>
          </div>
        </header>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-10 pt-6 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for serious barber operations
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Barber Shop Management, Payroll and Accounting for Malaysia
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              href="/dashboard"
            >
              Launch Product
            </Link>
            <Link
              className="rounded-md border border-border px-5 py-3 text-sm hover:bg-muted"
              href="/dashboard"
            >
              See Live Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Operations Snapshot</p>
            <p className="text-xs text-muted-foreground">KL Sentral HQ</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Today Sales</p>
              <p className="mt-1 text-xl font-semibold">RM 1,245</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Queue Waiting</p>
              <p className="mt-1 text-xl font-semibold">5</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Customers Served</p>
              <p className="mt-1 text-xl font-semibold">18</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Payroll Due</p>
              <p className="mt-1 text-xl font-semibold">RM 8,450</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-10 md:grid-cols-3">
        {coreHighlights.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-border/70 bg-card px-5 py-4"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm text-primary">Everything in one dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Modern operating system for barber businesses
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-border/70 bg-card p-5"
            >
              <div className="inline-flex rounded-md bg-primary/10 p-2 text-primary">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-xl border p-6 ${
                tier.featured
                  ? "border-primary bg-primary/10"
                  : "border-border/70 bg-card"
              }`}
            >
              <p className="text-sm text-muted-foreground">{tier.name}</p>
              <p className="mt-2 text-3xl font-semibold">{tier.price}</p>
              <p className="text-xs text-muted-foreground">{tier.note}</p>
              <ul className="mt-5 space-y-2">
                {tier.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <article
              key={faq.q}
              className="rounded-lg border border-border/70 bg-card p-5"
            >
              <h3 className="font-medium">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10">
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to transform your barber business?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Launch fast with a production-grade operations platform for modern barbershops.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            href="/dashboard"
          >
            Get Started <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
