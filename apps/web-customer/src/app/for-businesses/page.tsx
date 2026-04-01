import Link from "next/link";
import { Users, BarChart3, Clock, CreditCard, ArrowRight, CheckCircle2, Scissors } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const features = [
  {
    icon: Clock,
    title: "Smart Queue Management",
    description:
      "Eliminate walk-in chaos. Digital queue boards, party check-in, and real-time seat assignment keep your shop running smoothly.",
  },
  {
    icon: CreditCard,
    title: "Integrated POS",
    description:
      "Ring up sales, track commission per barber, and manage daily cash reporting — all from one dashboard.",
  },
  {
    icon: Users,
    title: "Staff & Scheduling",
    description:
      "Manage staff schedules, attendance, commission rates, and payroll — across all branches if you scale.",
  },
  {
    icon: BarChart3,
    title: "Revenue Insights",
    description:
      "Daily, weekly, and monthly reports by branch, barber, and service. Know exactly what drives your business.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "RM 49",
    period: "/month",
    description: "Perfect for single-branch shops just getting started.",
    features: [
      "1 branch",
      "Up to 5 staff",
      "Queue management",
      "POS & transactions",
      "Basic reports",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "RM 149",
    period: "/month",
    description: "For growing shops that need the full suite of tools.",
    features: [
      "Multi-branch",
      "Unlimited staff",
      "Appointments & CRM",
      "Commission & payroll",
      "Advanced analytics",
      "Priority support",
    ],
    highlighted: true,
  },
];

export default function ForBusinessesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(43 65% 52% / 0.10), transparent)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Scissors className="h-3.5 w-3.5" />
            BarberPro for Barbershop Owners
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Built for{" "}
            <span className="text-primary">Barbershop Owners</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to run your shop — queue, POS, staff, and customers — in one platform.
            Start your 14-day free trial today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://shop.barberpro.my/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://shop.barberpro.my"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              View Demo
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No credit card required.</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold">Everything Your Shop Needs</h2>
          <p className="mb-10 text-center text-muted-foreground">
            One platform, zero compromises.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Simple Pricing</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Start free for 14 days. No credit card required.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.highlighted
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://shop.barberpro.my/register"
                  className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  Start Free Trial
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
