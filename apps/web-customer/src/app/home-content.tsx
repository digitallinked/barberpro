"use client";

import Link from "next/link";
import { Scissors, CalendarCheck, Bell, Star, Search, ArrowRight, Clock, MapPin } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

export function HomeContent() {
  const t = useT();

  const features = [
    { icon: Search, title: t.home.discoverTitle, description: t.home.discoverDesc },
    { icon: CalendarCheck, title: t.home.bookTitle, description: t.home.bookDesc },
    { icon: Bell, title: t.home.queueTitle, description: t.home.queueDesc },
    { icon: Star, title: t.home.rewardsTitle, description: t.home.rewardsDesc },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(43 65% 52% / 0.12), transparent)",
          }}
        />

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <Scissors className="h-3.5 w-3.5" />
                {t.home.badge}
              </div>

              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
                {t.home.heroTitle}{" "}
                <span className="text-primary">{t.home.heroHighlight}</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {t.home.heroDesc}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/shops"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t.home.browseShops} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {t.home.howItWorks}
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.home.freeToUse}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.home.noAppNeeded}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.home.instantBooking}
                </span>
              </div>
            </div>

            {/* Right dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <p className="text-sm font-semibold text-foreground">{t.home.yourQueueTicket}</p>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    {t.home.live}
                  </span>
                </div>

                <div className="py-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.home.yourNumber}</p>
                  <p className="mt-2 text-8xl font-bold text-primary">A21</p>
                  <p className="mt-3 text-sm font-medium text-foreground">{t.home.nowServing} A19</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.home.minWait}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t.home.shop}</p>
                    <p className="mt-0.5 text-sm font-medium">Kings Barbershop</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{t.home.service}</p>
                    <p className="mt-0.5 text-sm font-medium">Haircut + Wash</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {t.home.time}
                    </div>
                    <p className="mt-0.5 text-sm font-medium">2:30 PM</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {t.home.branch}
                    </div>
                    <p className="mt-0.5 text-sm font-medium">Bangsar</p>
                  </div>
                </div>
              </div>

              {/* Floating loyalty badge */}
              <div className="absolute -right-4 -top-4 rounded-xl border border-primary/30 bg-card p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.home.loyaltyPoints}</p>
                    <p className="text-sm font-bold text-primary">1,240 pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t.home.featuresTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.home.featuresDesc}</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mt-4 text-muted-foreground">{t.home.ctaDesc}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.home.createFreeAccount} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              {t.home.browseShops}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.home.forBusinessesLabel}{" "}
            <Link href="/for-businesses" className="text-primary hover:underline">
              {t.home.learnAboutBusiness}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
