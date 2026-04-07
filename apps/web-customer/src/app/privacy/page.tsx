import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | BarberPro.my",
  description:
    "Customer Privacy Policy for BarberPro.my describing how we collect, use, disclose, store, and protect personal data in Malaysia.",
};

const EFFECTIVE_DATE = "6 April 2026";
const COMPANY_NAME = "BARBERPRO TECHNOLOGIES";
const COMPANY_REG = "202603081534 (NS0320892-W)";
const COMPANY_ADDRESS =
  "No. 23, Jalan 2/2, Bandar Baru Bangi, 43650 Bandar Baru Bangi, Selangor, Malaysia";
const CONTACT_EMAIL = "privacy@barberpro.my";
const DPO_EMAIL = "dpo@barberpro.my";

const sections = [
  {
    id: "1",
    title: "Who We Are and Scope of This Policy",
    content: [
      `${COMPANY_NAME} (Company No. ${COMPANY_REG}) ("BarberPro", "we", "us", or "our") operates the BarberPro consumer platform in Malaysia. This Privacy Policy explains how we collect, use, disclose, retain, and protect personal data when you browse participating shops, create an account, join a queue, request or manage appointments, subscribe to memberships, contact us, or otherwise interact with our consumer-facing services.`,
      `This notice is intended to support compliance with the Personal Data Protection Act 2010 of Malaysia ("PDPA"). It applies to personal data that BarberPro collects and controls in connection with the consumer Platform. It does not replace the privacy notices or policies of individual barber shops, each of which remains responsible for its own separate collection and processing of personal data in its own business operations.`,
      `If you require a Bahasa Malaysia version of this notice for operational or compliance purposes, please contact us using the details below.`,
    ],
  },
  {
    id: "2",
    title: "Personal Data We May Collect",
    content: [
      `Depending on how you use the Platform, we may collect: (a) identity data such as your name, username, profile information, and account identifiers; (b) contact data such as email address, telephone number, WhatsApp number, and communication preferences; (c) account and authentication data such as login credentials, verification details, and security preferences; (d) booking and queue data such as selected Merchant, branch, service preferences, queue entries, booking history, and related timestamps; (e) membership and billing data such as subscription status, invoice history, payment status, and limited payment-related information provided by our payment processors; (f) technical and usage data such as IP address, browser type, device information, cookies, logs, analytics events, and session activity; and (g) communications data such as enquiries, customer support requests, complaints, feedback, and survey responses.`,
      `We may also collect information you choose to provide in profile forms, customer support messages, marketing forms, contests, or referral activities.`,
      `We do not intentionally collect sensitive personal data unless reasonably necessary and lawful for the relevant purpose. If you provide sensitive data, you represent that you are entitled to do so.`,
    ],
  },
  {
    id: "3",
    title: "How We Collect Personal Data",
    content: [
      `We collect personal data directly from you when you sign up, sign in, join a queue, make a booking request, purchase or manage a membership, update your profile, contact us, or interact with the Platform. We also collect certain data automatically through cookies, logs, analytics tools, and similar technologies when you browse or use the Platform.`,
      `We may receive personal data from third parties such as payment processors, sign-in providers, communication channels, referral partners, anti-fraud tools, or participating Merchants where relevant to your use of the Platform and where disclosure is lawful.`,
      `If you provide information relating to another person, you are responsible for ensuring you have the right to do so and, where required, for informing that person accordingly.`,
    ],
  },
  {
    id: "4",
    title: "How We Use Personal Data",
    content: [
      `We may use personal data to: (a) create and manage your account; (b) enable bookings, queue participation, account authentication, notifications, and membership features; (c) display relevant shop, branch, queue, and account information to you; (d) process payments, invoices, renewals, and billing support; (e) communicate with you regarding bookings, queue movements, account security, product updates, service notices, and customer support; (f) improve the Platform, investigate incidents, prevent fraud, and maintain security; (g) send marketing communications where permitted and not objected to by you; and (h) comply with legal, tax, accounting, regulatory, and dispute-resolution obligations.`,
      `If you do not provide certain required personal data, some parts of the Platform may not function properly, and we may be unable to create your account, provide membership benefits, or process certain requests.`,
      `Where required, we will seek consent for particular uses of personal data, especially where those uses materially differ from the original purpose of collection.`,
    ],
  },
  {
    id: "5",
    title: "BarberPro and Merchant Responsibility",
    content: [
      `BarberPro controls the personal data it collects for operating the consumer Platform. However, each participating Merchant independently controls personal data it collects in its own shop, through its own systems, at the counter, during service delivery, through its own staff, or under its own legal obligations.`,
      `When you book with or visit a Merchant, some of your personal data may be shared with that Merchant so it can manage your booking, queue, attendance, service delivery, loyalty handling, or customer support. Once received by the Merchant for its own business purposes, that Merchant is responsible for its own handling of your personal data and for its own compliance with applicable law.`,
      `BarberPro is not responsible for a Merchant's independent privacy practices, staff conduct, disclosures, security posture, or retention decisions once the Merchant has lawfully received your data for its own purposes.`,
    ],
  },
  {
    id: "6",
    title: "Disclosure of Personal Data",
    content: [
      `We may disclose personal data to participating Merchants, payment processors, cloud hosting providers, communications providers, analytics vendors, customer support tools, professional advisers, insurers, auditors, affiliates, and other service providers where reasonably necessary to operate the Platform and fulfil the purposes described in this Policy.`,
      `We may also disclose personal data where required or permitted by law, court order, regulatory requirement, law enforcement request, merger or business transfer, financing transaction, fraud prevention, incident response, or protection of rights, property, safety, or legal position.`,
      `We do not sell your personal data for cash consideration. We do not permit third parties to use your personal data for their own unrelated marketing purposes except where you separately choose to engage with that third party.`,
    ],
  },
  {
    id: "7",
    title: "Cross-Border Transfers and Security",
    content: [
      `The Platform may rely on hosting, backups, software tools, and service providers located in or outside Malaysia. As a result, personal data may be transferred to, stored in, or accessed from jurisdictions outside Malaysia.`,
      `Where we arrange such transfers, we take reasonable steps to require appropriate confidentiality, security, and handling measures from relevant recipients, having regard to the nature of the data and the purpose of processing.`,
      `We implement reasonable administrative, organisational, and technical safeguards to protect personal data. However, no internet-based system, platform, transmission, or storage environment is entirely secure, and we cannot guarantee absolute security.`,
    ],
  },
  {
    id: "8",
    title: "Retention of Personal Data",
    content: [
      `We retain personal data for as long as reasonably necessary for the purpose for which it was collected, for continuity and backup purposes, for fraud prevention, to resolve disputes, to enforce our agreements, and to comply with legal, accounting, tax, and regulatory obligations.`,
      `Retention periods vary depending on the type of data, whether your account remains active, whether there is an ongoing subscription or dispute, and whether longer retention is required by law or for legitimate operational reasons.`,
      `When personal data is no longer reasonably required, we may delete, anonymise, aggregate, or de-identify it, subject always to backup cycles, lawful retention obligations, and technical constraints.`,
    ],
  },
  {
    id: "9",
    title: "Your Rights and Choices",
    content: [
      `Subject to applicable law, you may request access to personal data we hold about you, request correction of inaccurate or incomplete data, withdraw consent where processing depends on consent, and ask us to stop or limit direct marketing communications.`,
      `We may require sufficient information to verify your identity and authority before acting on a request. We may also refuse or limit a request where permitted by law, including where the request affects the rights of others, conflicts with legal obligations, or falls within a lawful exception.`,
      `To exercise your rights or submit a privacy complaint, please contact us using the details below. You may also unsubscribe from marketing emails using the unsubscribe mechanism within the communication.`,
    ],
  },
  {
    id: "10",
    title: "Cookies and Analytics",
    content: [
      `The Platform may use cookies, pixels, local storage, session tools, and similar technologies to authenticate users, remember preferences, analyse usage, improve performance, support queue and booking experiences, and maintain security.`,
      `You may be able to manage certain settings through your browser or device controls. Disabling some cookies or technologies may affect Platform functionality, sign-in persistence, or user experience.`,
      `Where non-essential cookies or similar technologies require consent under applicable law or our policy, we will seek that consent through the relevant interface before enabling them.`,
    ],
  },
  {
    id: "11",
    title: "Changes to This Policy and Contact Details",
    content: [
      `We may amend this Privacy Policy from time to time to reflect changes in our operations, technology, legal requirements, Merchant relationships, security posture, or product features. The updated version will take effect from the effective date stated on this page unless otherwise specified.`,
      `For privacy requests, complaints, or enquiries, contact ${COMPANY_NAME}, ${COMPANY_ADDRESS}, email ${CONTACT_EMAIL}, or contact our privacy team at ${DPO_EMAIL}.`,
      `If you are dissatisfied with our response, you may also consider contacting the relevant Malaysian data protection authority or obtaining independent legal advice where appropriate.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-muted/30 px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Legal
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Privacy Policy</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Customer privacy terms for how BarberPro.my collects, uses, discloses, stores, and
              protects personal data in Malaysia.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Effective Date: <span className="font-semibold text-foreground">{EFFECTIVE_DATE}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/terms"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                Terms of Service
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                Privacy Enquiries
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
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Privacy Notice</p>
                <p className="mt-2">
                  This policy covers BarberPro's own handling of customer data on the Platform.
                  Participating Merchants remain independently responsible for their own in-shop
                  collection, use, disclosure, and retention of personal data.
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
