import Link from "next/link";
import { Search, CalendarCheck, Bell, Star, ArrowRight } from "lucide-react";

import { Navbar } from "@/components/navbar";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover Shops",
    description:
      "Browse verified barbershops near you. See services, pricing, barbers, and live queue status before you even leave home.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Book Online",
    description:
      "Pick your service, choose your barber, and lock in a slot. Appointments are confirmed instantly — no calls, no waiting on hold.",
  },
  {
    number: "03",
    icon: Bell,
    title: "Track Your Queue",
    description:
      "Get a live queue ticket. Track your position in real-time so you arrive right on time — no more sitting and waiting.",
  },
  {
    number: "04",
    icon: Star,
    title: "Earn Rewards",
    description:
      "Collect loyalty points with every visit. Unlock Silver and Gold tiers. Redeem points for free services at your favourite shops.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">How BarberPro Works</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Your barbershop experience, simplified in four easy steps.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group flex gap-6 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground">
                      STEP {step.number}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden items-center sm:flex">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-xl font-bold">Ready to get started?</h2>
            <p className="mt-2 text-muted-foreground">
              Find a barbershop near you and book your first appointment today.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Browse Shops <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:border-primary/40"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BarberPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
