"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitContactForm } from "@/actions/contact";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0d1013] p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
          <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Message Sent!</h3>
        <p className="mt-2 text-sm text-gray-400">{state.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-white">Send Us a Message</h2>
      <p className="mt-2 text-sm text-gray-400">
        Fill in the form and our team will get back to you within one business day.
      </p>

      <form action={action} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="firstName">
              First Name
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
            <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="lastName">
              Last Name
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
          <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ahmad@barbershop.my"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="subject">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            className={inputClass}
          >
            <option value="">Select a topic…</option>
            <option value="Sales — Pricing &amp; Plans">Sales — Pricing &amp; Plans</option>
            <option value="Request a Demo">Request a Demo</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Billing &amp; Account">Billing &amp; Account</option>
            <option value="Partnership / Reseller">Partnership / Reseller</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder="Tell us about your barber shop and how we can help…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {state && !state.success && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#d4af37] py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Sending…" : "Send Message"}
        </button>

        <p className="text-center text-xs text-gray-600">
          By submitting this form, you agree to our{" "}
          <Link href="/privacy" className="text-[#d4af37] hover:underline">
            Privacy Policy
          </Link>.
        </p>
      </form>
    </div>
  );
}
