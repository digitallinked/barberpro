"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useT } from "@/lib/i18n/language-context";
import { submitContactForm } from "@/actions/contact";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20";

export function ContactForm() {
  const t = useT();
  const c = t.contact;
  const [state, action, pending] = useActionState(submitContactForm, null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
          <svg
            className="h-7 w-7 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">{c.successTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{c.successDesc}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight">{c.formTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{c.formDesc}</p>

      <form action={action} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="firstName">
              {c.firstName}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              placeholder="Ahmad"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="lastName">
              {c.lastName}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              placeholder="Razak"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="email">
            {c.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ahmad@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="subject">
            {c.subjectLabel}
          </label>
          <select id="subject" name="subject" className={inputClass}>
            <option value="">{c.subjectPlaceholder}</option>
            <option value={c.subjectGeneral}>{c.subjectGeneral}</option>
            <option value={c.subjectBooking}>{c.subjectBooking}</option>
            <option value={c.subjectAccount}>{c.subjectAccount}</option>
            <option value={c.subjectPlus}>{c.subjectPlus}</option>
            <option value={c.subjectFeedback}>{c.subjectFeedback}</option>
            <option value={c.subjectOther}>{c.subjectOther}</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground" htmlFor="message">
            {c.messageLabel}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder={c.messagePlaceholder}
            className={`${inputClass} resize-none`}
          />
        </div>

        {state && !state.success && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? c.submitting : c.submit}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {c.privacyNote}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {c.privacyLink}
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
