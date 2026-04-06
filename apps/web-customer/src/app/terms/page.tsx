import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Terms of Service | BarberPro.my",
  description:
    "Customer Terms of Service for using BarberPro.my to discover shops, book appointments, join queues, and manage memberships in Malaysia.",
};

const EFFECTIVE_DATE = "6 April 2026";
const COMPANY_NAME = "NEWY ENTERPRISE";
const COMPANY_REG = "202403063508 (003583055-X)";
const COMPANY_ADDRESS =
  "Level 12, Menara XYZ, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia";
const CONTACT_EMAIL = "legal@barberpro.my";

const sections = [
  {
    id: "1",
    title: "Acceptance and Scope",
    content: [
      `${COMPANY_NAME} (Company No. ${COMPANY_REG}) ("BarberPro", "we", "us", or "our") operates the BarberPro consumer platform, including the website, mobile-ready web application, queue tracking pages, customer membership pages, and related services made available to end users in Malaysia (collectively, the "Platform"). These Terms of Service ("Terms") govern your access to and use of the Platform.`,
      `By creating an account, browsing shop listings, making a booking, joining a queue, purchasing a membership, or otherwise using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.`,
      `If you are under 18 years of age, you should use the Platform only with the involvement and permission of a parent or legal guardian. If you do not agree to these Terms, you must not use the Platform.`,
    ],
  },
  {
    id: "2",
    title: "BarberPro's Role and Independent Barber Shops",
    content: [
      `BarberPro provides a technology platform that helps users discover participating barber shops, view selected listing information, request bookings, join walk-in queues, receive updates, and manage certain account and membership features. Unless expressly stated otherwise, BarberPro is not the operator, owner, employer, manager, franchisor, agent, or representative of any listed barber shop, branch, barber, or merchant ("Merchant").`,
      `Each Merchant is an independent business and is solely responsible for its own premises, hygiene, safety standards, waiting times, appointment handling, service quality, barber conduct, pricing, promotions, product suitability, refunds, cancellations, customer treatment, and compliance with applicable laws. Any contract for grooming or barber services is between you and the relevant Merchant, not with BarberPro.`,
      `Accordingly, claims, complaints, disputes, injuries, losses, dissatisfaction, allergic reactions, missed appointments, delays, service defects, or quality concerns relating to goods or services supplied by a Merchant must be raised with that Merchant in the first instance, except to the extent such issue is directly caused by BarberPro's own proven breach of these Terms.`,
    ],
  },
  {
    id: "3",
    title: "Listings, Availability, Prices, and Information Accuracy",
    content: [
      `Shop profiles, service descriptions, photographs, operating hours, queue lengths, prices, wait times, promotions, loyalty benefits, barber availability, and similar information displayed on the Platform may be supplied by Merchants, generated from Merchant activity, or estimated by system logic. Such information is provided for general convenience only and may be incomplete, inaccurate, delayed, withdrawn, or outdated.`,
      `Merchants may change their prices, policies, services, staff, operating hours, availability, promotions, booking windows, walk-in rules, refund rules, and other terms at any time, with or without prior notice to you. Final pricing, final service scope, and final Merchant terms are determined by the relevant Merchant at the point of service unless otherwise expressly stated.`,
      `BarberPro does not guarantee the accuracy, completeness, suitability, legality, or continued availability of any Merchant listing, service, price, promotion, slot, queue estimate, or other content on the Platform.`,
    ],
  },
  {
    id: "4",
    title: "Accounts, Eligibility, and Security",
    content: [
      `You must provide accurate, current, and complete information when creating or maintaining an account. You are responsible for keeping your login credentials confidential and for all activity that occurs under your account.`,
      `You must not impersonate another person, create an account using false information, share your credentials in a way that compromises security, interfere with another user's account, or use the Platform for any unlawful, abusive, or fraudulent purpose.`,
      `We may require identity verification, limit account access, suspend features, or close accounts where we reasonably consider it necessary for security, fraud prevention, legal compliance, operational integrity, or enforcement of these Terms.`,
    ],
  },
  {
    id: "5",
    title: "Bookings, Queue Tickets, and Merchant Fulfilment",
    content: [
      `A booking request, queue ticket, confirmation screen, queue number, estimated wait time, notification, or reminder on the Platform does not by itself guarantee that the relevant Merchant will honour the requested slot, provide a specific barber, avoid delays, or complete the service at a particular time. All appointments and queue handling remain subject to Merchant confirmation, shop capacity, staff availability, late arrival rules, operational constraints, and on-site conditions.`,
      `Queue times are estimates only and may move forwards, backwards, pause, accelerate, or be cancelled at any time. Queue numbers, queue visibility, and notifications are informational tools and must not be treated as a promise of exact service timing.`,
      `If you are late, absent, unreachable, or fail to comply with a Merchant's check-in requirements, the Merchant may cancel, forfeit, reschedule, or deprioritise your booking or queue entry. BarberPro is not liable for Merchant no-shows, refusals, delays, overbooking, service substitutions, or on-site operational decisions.`,
    ],
  },
  {
    id: "6",
    title: "Payments, BarberPro Plus, and Billing",
    content: [
      `Certain Platform features may be free, while others may require payment, including BarberPro Plus or other memberships, fees, or future paid features. If you purchase a paid membership or feature from BarberPro, you authorise us and our payment service providers to charge the stated fees, recurring renewal charges, taxes, and related amounts using your chosen payment method.`,
      `Membership benefits, plan names, prices, eligibility rules, trial periods, included perks, participating Merchant benefits, billing cycles, and renewal mechanics may be introduced, changed, restricted, withdrawn, or discontinued by BarberPro at any time. Unless prohibited by law, updated pricing or plan terms may apply immediately to new purchases and at your next renewal for existing subscriptions after reasonable notice.`,
      `Except where required by applicable Malaysian law or where we expressly state otherwise in writing, payments to BarberPro are non-refundable once charged. Cancellation of a BarberPro membership stops future renewal charges but does not automatically create a refund for the current billing period, partial periods, unused benefits, or failure to use the Platform.`,
    ],
  },
  {
    id: "7",
    title: "Merchant Charges, Refunds, and Disputes",
    content: [
      `If you pay a Merchant directly or incur charges at a Merchant's premises, those amounts are owed to the Merchant, not to BarberPro, unless the Platform expressly states that BarberPro is acting as the merchant of record for that specific transaction.`,
      `Refunds, rescheduling rights, dissatisfaction claims, service complaints, product complaints, and compensation requests relating to barber services or products supplied by a Merchant are governed by the Merchant's own policies and applicable law. BarberPro does not assume responsibility for issuing refunds for Merchant-provided services or products unless we are specifically required to do so by law.`,
      `Nothing in these Terms limits any non-excludable rights you may have under Malaysian law. However, to the fullest extent permitted by law, you agree that BarberPro is not responsible for disputes whose substance concerns a Merchant's conduct, service outcome, price, quality, safety, or business policy.`,
    ],
  },
  {
    id: "8",
    title: "Acceptable Use and User Content",
    content: [
      `You must use the Platform lawfully, honestly, and respectfully. You must not upload malicious code, interfere with security features, scrape the Platform without authorisation, reverse engineer the Platform, infringe intellectual property rights, make false complaints, abuse Merchant staff, or use the Platform in a way that could harm BarberPro, Merchants, or other users.`,
      `If you submit reviews, feedback, suggestions, profile information, photographs, messages, or other content, you are responsible for ensuring that content is lawful, accurate, non-defamatory, and does not infringe third-party rights. We may remove, moderate, reject, or restrict any content in our discretion.`,
      `By submitting content or feedback to BarberPro, you grant us a non-exclusive, worldwide, royalty-free licence to host, reproduce, adapt, display, and use that content for Platform operation, support, moderation, security, analytics, marketing, and improvement purposes, subject always to our Privacy Policy.`,
    ],
  },
  {
    id: "9",
    title: "Intellectual Property",
    content: [
      `The Platform, including its software, designs, layout, branding, text, logos, workflows, database rights, and related intellectual property, belongs to BarberPro or its licensors and is protected by applicable laws. Your use of the Platform gives you a limited, revocable, non-exclusive, non-transferable right to access and use it for personal, non-commercial consumer purposes in accordance with these Terms.`,
      `You must not copy, distribute, modify, publicly display, create derivative works from, sell, rent, sublicense, or otherwise exploit any part of the Platform except as expressly permitted by law or by our prior written consent.`,
    ],
  },
  {
    id: "10",
    title: "Disclaimers",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. BARBERPRO MAKES NO REPRESENTATION OR WARRANTY THAT THE PLATFORM WILL ALWAYS BE AVAILABLE, UNINTERRUPTED, ERROR-FREE, SECURE, TIMELY, ACCURATE, OR SUITABLE FOR YOUR REQUIREMENTS.`,
      `WITHOUT LIMITING THE FOREGOING, BARBERPRO DOES NOT WARRANT OR GUARANTEE ANY MERCHANT'S QUALITY, CLEANLINESS, SAFETY, LICENSING STATUS, STAFF CONDUCT, PRODUCT SUITABILITY, WAIT TIME, APPOINTMENT AVAILABILITY, OR SERVICE OUTCOME. You are solely responsible for deciding whether a Merchant, service, product, barber, or treatment is suitable for you, including with regard to allergies, sensitivities, health considerations, and personal preferences.`,
      `Nothing in these Terms excludes any guarantee, remedy, or right that cannot lawfully be excluded under Malaysian law.`,
    ],
  },
  {
    id: "11",
    title: "Limitation of Liability",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARBERPRO AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL LOSS OR DAMAGE, OR FOR ANY LOSS OF SAVINGS, OPPORTUNITY, DATA, GOODWILL, OR ENJOYMENT ARISING OUT OF OR IN CONNECTION WITH THE PLATFORM OR ANY MERCHANT-PROVIDED SERVICE.`,
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARBERPRO'S TOTAL AGGREGATE LIABILITY TO YOU FOR CLAIMS ARISING OUT OF OR IN CONNECTION WITH THE PLATFORM OR THESE TERMS WILL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU ACTUALLY PAID TO BARBERPRO IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) RM100.`,
      `Nothing in these Terms limits or excludes liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability that cannot lawfully be limited or excluded under Malaysian law.`,
    ],
  },
  {
    id: "12",
    title: "Indemnity, Suspension, and Termination",
    content: [
      `You agree to indemnify and hold harmless BarberPro, its affiliates, officers, directors, employees, agents, and service providers from and against claims, losses, liabilities, costs, and expenses arising from your breach of these Terms, your misuse of the Platform, your unlawful conduct, your submitted content, or your disputes with Merchants or other users.`,
      `We may suspend, limit, or terminate your access to the Platform, with or without notice, if we reasonably believe that: (a) you have breached these Terms; (b) your conduct creates legal, security, payment, fraud, reputational, or operational risk; (c) we are required to do so by law or by a competent authority; or (d) continued provision of the Platform is no longer commercially, technically, or legally viable.`,
      `You may stop using the Platform at any time. Sections that by their nature should survive termination, including intellectual property, disclaimers, liability limits, indemnities, governing law, and dispute-related provisions, will survive.`,
    ],
  },
  {
    id: "13",
    title: "Changes to These Terms and General",
    content: [
      `We may amend these Terms at any time by posting an updated version on the Platform, by email, or by another reasonable notice method. We may also change Platform features, prices, memberships, benefits, Merchant participation, and operational rules at any time.`,
      `Unless a shorter period is required for security, legal, or operational reasons, material changes will generally take effect on the date stated in the updated Terms. Your continued use of the Platform after that date constitutes your acceptance of the revised Terms.`,
      `These Terms are governed by the laws of Malaysia. Any dispute that cannot be resolved amicably will be subject to the exclusive jurisdiction of the courts of Malaysia, except where applicable law requires otherwise. If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in full force and effect.`,
      `For legal notices and enquiries, contact ${COMPANY_NAME}, ${COMPANY_ADDRESS}, or email ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-muted/30 px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Legal
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Terms of Service</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Customer terms for using BarberPro.my to discover barber shops, book appointments,
              join queues, and manage memberships in Malaysia.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Effective Date: <span className="font-semibold text-foreground">{EFFECTIVE_DATE}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/privacy"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                Privacy Policy
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                Legal Enquiries
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[220px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contents
                </p>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#section-${section.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {section.id}. {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="space-y-8">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important Notice</p>
                <p className="mt-2">
                  Merchant prices, availability, queue times, and merchant-level terms may change at
                  any time. BarberPro acts as the platform provider and does not control each
                  Merchant's on-site operations or service outcomes.
                </p>
              </div>

              {sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xl font-bold tracking-tight">
                    {section.id}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-7 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
