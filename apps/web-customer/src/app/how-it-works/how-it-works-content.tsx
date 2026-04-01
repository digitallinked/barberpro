"use client";

import Link from "next/link";
import { Search, CalendarCheck, Bell, Star, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

export function HowItWorksContent() {
  const t = useT();

  const steps = [
    { number: "01", icon: Search, title: t.howItWorks.step1Title, description: t.howItWorks.step1Desc },
    { number: "02", icon: CalendarCheck, title: t.howItWorks.step2Title, description: t.howItWorks.step2Desc },
    { number: "03", icon: Bell, title: t.howItWorks.step3Title, description: t.howItWorks.step3Desc },
    { number: "04", icon: Star, title: t.howItWorks.step4Title, description: t.howItWorks.step4Desc },
  ];

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{t.howItWorks.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t.howItWorks.desc}</p>
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
                    {t.howItWorks.step} {step.number}
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
          <h2 className="text-xl font-bold">{t.howItWorks.readyTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.howItWorks.readyDesc}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.howItWorks.browseShops} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:border-primary/40"
            >
              {t.howItWorks.createAccount}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
