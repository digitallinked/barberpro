import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Contact Us | BarberPro.my",
  description:
    "Get in touch with the BarberPro.my team. We're here to help Malaysian barber shops succeed."
};

const contactChannels = [
  {
    icon: MessageCircle,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    title: "WhatsApp Support",
    description: "Chat with us directly on WhatsApp for the fastest response.",
    action: "Chat on WhatsApp",
    href: "https://wa.me/60123456789",
    note: "Typically replies within 1 hour"
  },
  {
    icon: Mail,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    title: "Email Us",
    description: "Send us a detailed message and we'll get back to you within 24 hours.",
    action: "hello@barberpro.my",
    href: "mailto:hello@barberpro.my",
    note: "Response within 1 business day"
  },
  {
    icon: Phone,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    title: "Call Us",
    description: "Speak to a real person. Available during Malaysian business hours.",
    action: "+60 12-345 6789",
    href: "tel:+60123456789",
    note: "Mon–Fri, 9am–6pm MYT"
  }
];

const offices = [
  {
    city: "Bandar Baru Bangi, Selangor",
    address: "No. 23, Jalan 2/2, Bandar Baru Bangi, 43650 Bandar Baru Bangi, Selangor",
    mapQuery: "No+23+Jalan+2%2F2+Bandar+Baru+Bangi+43650"
  }
];

const faqHighlights = [
  {
    q: "How long does onboarding take?",
    a: "Most shops are fully set up within 30 minutes. Our team will walk you through the process live."
  },
  {
    q: "Do you offer training for my staff?",
    a: "Yes — we provide free onboarding training via video call or WhatsApp screen-share for all new accounts."
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

      {/* ── Contact Channels ── */}
      <section className="bg-[#0d1013] pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {contactChannels.map((channel) => (
              <div
                key={channel.title}
                className="rounded-2xl border border-white/5 bg-[#13161a] p-6"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${channel.iconBg} mb-5`}>
                  <channel.icon className={`h-6 w-6 ${channel.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white">{channel.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{channel.description}</p>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-[#d4af37] hover:underline"
                >
                  {channel.action}
                </a>
                <p className="mt-1 text-xs text-gray-600">{channel.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form + Info ── */}
      <section className="bg-[#13161a] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">

            {/* Form */}
            <div>
              <h2 className="text-2xl font-black text-white">Send Us a Message</h2>
              <p className="mt-2 text-sm text-gray-400">
                Fill in the form and our team will get back to you within one business day.
              </p>
              <form className="mt-8 space-y-5" action="mailto:hello@barberpro.my" method="post" encType="text/plain">
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
                      className="w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
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
                      className="w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
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
                    className="w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="phone">
                    Phone / WhatsApp <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+60 12-345 6789"
                    className="w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-400" htmlFor="subject">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
                  >
                    <option value="">Select a topic…</option>
                    <option value="sales">Sales — Pricing & Plans</option>
                    <option value="demo">Request a Demo</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Account</option>
                    <option value="partnership">Partnership / Reseller</option>
                    <option value="other">Other</option>
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
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0d1013] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#d4af37] py-3.5 text-sm font-bold text-black transition hover:brightness-110"
                >
                  Send Message
                </button>
                <p className="text-center text-xs text-gray-600">
                  By submitting this form, you agree to our{" "}
                  <Link href="/privacy" className="text-[#d4af37] hover:underline">Privacy Policy</Link>.
                </p>
              </form>
            </div>

            {/* Info Panel */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white">Our Office</h2>
                <div className="mt-6 space-y-4">
                  {offices.map((office) => (
                    <div key={office.city} className="rounded-2xl border border-white/5 bg-[#0d1013] p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d4af37]/20">
                          <MapPin className="h-4 w-4 text-[#d4af37]" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{office.city}</p>
                          <p className="mt-1 text-sm text-gray-400">{office.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#0d1013] p-5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d4af37]/20">
                    <Clock className="h-4 w-4 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Business Hours</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      <p>Monday – Friday: 9:00 AM – 6:00 PM MYT</p>
                      <p>Saturday: 10:00 AM – 2:00 PM MYT</p>
                      <p>Sunday & Public Holidays: Closed</p>
                      <p className="mt-2 text-xs text-gray-600">
                        WhatsApp support is monitored outside these hours for urgent issues.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
