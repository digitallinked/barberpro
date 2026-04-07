"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";
import { ContactForm } from "./contact-form";

export function ContactContent() {
  const t = useT();
  const c = t.contact;

  const faqs = [
    { q: c.faqQ1, a: c.faqA1 },
    { q: c.faqQ2, a: c.faqA2 },
    { q: c.faqQ3, a: c.faqA3 },
    { q: c.faqQ4, a: c.faqA4 },
  ];

  return (
    <main className="flex-1 bg-background">

      {/* ── Hero ── */}
      <section className="border-b border-border/60 bg-muted/30 px-6 py-16 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{c.heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{c.heroDesc}</p>
      </section>

      {/* ── Email channel ── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold">{c.emailTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.emailDesc}</p>
            <a
              href="mailto:hello@barberpro.my"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              hello@barberpro.my
            </a>
            <p className="mt-1 text-xs text-muted-foreground">{c.emailNote}</p>
          </div>
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">

            {/* Form */}
            <ContactForm />

            {/* FAQ */}
            <div>
              <h3 className="text-lg font-bold">{c.faqTitle}</h3>
              <div className="mt-4 space-y-3">
                {faqs.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-border bg-card"
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground select-none group-open:text-primary">
                      {item.q}
                    </summary>
                    <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
              <Link
                href="/help"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {c.viewHelp}
              </Link>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
