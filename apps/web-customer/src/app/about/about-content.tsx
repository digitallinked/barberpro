"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  MapPin,
  Scissors,
  Search,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

export function AboutContent() {
  const t = useT();

  const benefits = [
    { icon: Search, title: t.about.b1Title, description: t.about.b1Desc },
    { icon: CalendarCheck, title: t.about.b2Title, description: t.about.b2Desc },
    { icon: Bell, title: t.about.b3Title, description: t.about.b3Desc },
    { icon: Star, title: t.about.b4Title, description: t.about.b4Desc },
  ];

  const problemCards = [
    { title: t.about.problemCard1Title, description: t.about.problemCard1Desc },
    { title: t.about.problemCard2Title, description: t.about.problemCard2Desc },
    { title: t.about.problemCard3Title, description: t.about.problemCard3Desc },
  ];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(43 65% 52% / 0.12), transparent)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <MapPin className="h-3.5 w-3.5" />
            {t.about.badge}
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {t.about.heroTitle}{" "}
            <span className="text-primary">{t.about.heroHighlight}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.about.heroDesc}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.about.browseShops} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              {t.about.createAccount}
            </Link>
          </div>
        </div>
      </section>

      {/* Problem section */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.about.problemTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.about.problemDesc}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {problemCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex h-2 w-8 rounded-full bg-primary/40" />
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.about.benefitsTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.about.benefitsDesc}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free for customers */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t.about.freeTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t.about.freeDesc}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {["No registration fee", "No booking fee", "No subscription required"].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Malaysia */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-10 rounded-2xl border border-border bg-card p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Scissors className="h-3 w-3" />
                Built for Malaysia
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Designed Around How Malaysians Get Their Hair Cut
              </h2>
              <p className="mt-4 text-muted-foreground">
                Walk-ins, appointments, DuitNow QR, Bahasa interfaces. BarberPro.my
                is built specifically for the Malaysian market, not adapted from something
                made elsewhere.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, label: "PDPA Compliant" },
                { icon: MapPin, label: "Malaysia-First" },
                { icon: Star, label: "Loyalty Rewards" },
                { icon: Bell, label: "Live Queue Tracking" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.about.ctaTitle}</h2>
          <p className="mt-3 text-muted-foreground">{t.about.ctaDesc}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.about.browseShops} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              {t.about.createAccount}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            For barbershop owners?{" "}
            <Link href="/for-businesses" className="text-primary hover:underline">
              Learn about BarberPro for Business
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
