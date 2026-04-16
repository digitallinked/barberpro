import Link from "next/link";
import { Mail } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ContactForm } from "./contact-form";
import { marketingPageMetadata } from "@/lib/seo";

const CONTACT_TITLE = "Contact Us | BarberPro.my";
const CONTACT_DESC =
  "Get in touch with the BarberPro.my team. We're here to help Malaysian barber shops succeed.";

export const metadata = marketingPageMetadata("/contact", CONTACT_TITLE, CONTACT_DESC);

const faqHighlights = [
  {
    q: "How long does onboarding take?",
    a: "Most shops are fully set up within 30 minutes. Our team will walk you through the process live."
  },
  {
    q: "Do you offer training for my staff?",
    a: "Yes — we provide free onboarding training via video call for all new accounts."
  },
  {
    q: "Is there a contract or lock-in?",
    a: "No contracts. Cancel anytime. We earn your business every month by delivering real value."
  },
  {
    q: "Can I migrate data from my existing system?",
    a: "Yes. Our team helps migrate customer records, services, and pricing from any existing system or spreadsheet."
  }
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0d1013] py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Whether you have a question, need help getting started, or just want to say hi —
            our team is here for you.
          </p>
        </div>
      </section>

      {/* ── Email channel ── */}
      <section className="bg-[#0d1013] pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#13161a] p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 mb-5">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Email Us</h3>
              <p className="mt-2 text-sm text-gray-400">
                Send us a detailed message and we&apos;ll get back to you within 24 hours.
              </p>
              <a
                href="mailto:hello@barberpro.my"
                className="mt-4 inline-block text-sm font-semibold text-[#d4af37] hover:underline"
              >
                hello@barberpro.my
              </a>
              <p className="mt-1 text-xs text-gray-600">Response within 1 business day</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Form + FAQ ── */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">

            {/* Form */}
            <ContactForm />

            {/* FAQ */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white">Quick Answers</h3>
                <div className="mt-4 space-y-3">
                  {faqHighlights.map((item) => (
                    <details key={item.q} className="group rounded-xl border border-white/5 bg-[#0d1013]">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-300 select-none group-open:text-[#d4af37]">
                        {item.q}
                      </summary>
                      <p className="border-t border-white/5 px-4 py-3 text-sm text-gray-400">{item.a}</p>
                    </details>
                  ))}
                </div>
                <Link
                  href="/help"
                  className="mt-4 inline-block text-sm font-semibold text-[#d4af37] hover:underline"
                >
                  View full Help Center →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
