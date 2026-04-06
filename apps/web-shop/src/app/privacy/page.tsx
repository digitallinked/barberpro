import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  title: "Privacy Policy | BarberPro.my",
  description:
    "BarberPro.my Privacy Policy describing how we collect, use, disclose, store, and protect personal data in connection with our Malaysia-based barber shop software platform.",
};

const EFFECTIVE_DATE = "6 April 2026";
const COMPANY_NAME = "NEWY ENTERPRISE";
const COMPANY_REG = "202403063508 (003583055-X)";
const COMPANY_ADDRESS =
  "Level 12, Menara XYZ, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia";
const CONTACT_EMAIL = "privacy@barberpro.my";
const DPO_EMAIL = "dpo@barberpro.my";

const sections = [
  {
    id: "1",
    title: "Who We Are and Scope of This Notice",
    content: [
      `${COMPANY_NAME} (Company No. ${COMPANY_REG}) ("BarberPro", "we", "us", or "our") is a Malaysian company that provides the BarberPro platform and related services to barber shop operators and related businesses. This Privacy Policy explains how we collect, use, disclose, retain, and protect personal data in connection with our websites, applications, support channels, communications, demos, marketing activities, and business subscriber accounts.`,
      `This notice is intended to assist compliance with the Personal Data Protection Act 2010 of Malaysia ("PDPA"). It applies to personal data relating to business owners, staff, account administrators, billing contacts, leads, website visitors, and other persons who interact directly with BarberPro. It should be read together with any just-in-time notices, forms, or service-specific disclosures that we may provide at or before the point of collection.`,
      `If you require a Bahasa Malaysia version of this notice for operational or compliance purposes, please contact us using the details below.`,
    ],
  },
  {
    id: "2",
    title: "Categories of Personal Data We Collect",
    content: [
      `Depending on your relationship with us, we may collect and process the following categories of personal data: (a) identity data such as your name, job title, business name, and branch details; (b) contact data such as your email address, telephone number, WhatsApp number, correspondence address, and billing address; (c) account and authentication data such as login credentials, account roles, security settings, and verification information; (d) billing and transaction data such as plan selection, invoice details, tax information, payment status, and partial payment method information provided by payment processors; (e) technical and usage data such as IP address, browser type, device identifiers, session logs, activity logs, and support diagnostics; and (f) communications data such as enquiries, feedback, support requests, and call or chat records.`,
      `We may also receive business-related personal data you choose to provide in onboarding files, support tickets, migration requests, bug reports, sales enquiries, or implementation communications.`,
      `We do not intentionally require sensitive personal data unless it is reasonably necessary for a lawful purpose. Where sensitive data is involved, you are responsible for ensuring any disclosure to us is lawful and appropriate for the purpose for which it is provided.`,
    ],
  },
  {
    id: "3",
    title: "How We Collect Personal Data",
    content: [
      `We collect personal data directly from you when you sign up, request a demo, subscribe, contact us, submit forms, correspond with us, participate in promotions, or use the Service. We also collect certain technical and usage data automatically through cookies, server logs, product analytics, and similar technologies when you visit or interact with our websites or applications.`,
      `We may receive personal data from third parties such as payment processors, referral partners, identity or fraud screening providers, communication platforms, cloud service providers, and publicly available business sources where permitted by law.`,
      `If you provide personal data relating to another person, you represent that you have the authority to do so and, where required, have provided the relevant notice and obtained any required consent.`,
    ],
  },
  {
    id: "4",
    title: "Purposes of Processing",
    content: [
      `We process personal data for lawful business and operational purposes, including to: (a) create and administer accounts; (b) verify identity, authority, and business legitimacy; (c) provide, operate, secure, maintain, and improve the Service; (d) process subscriptions, renewals, invoices, credits, collections, and payment disputes; (e) provide implementation, support, communications, and account management; (f) monitor product usage, prevent abuse, investigate incidents, and protect the integrity of the Service; (g) send service notices, transactional messages, security alerts, product updates, and, where permitted, marketing communications; (h) comply with legal, regulatory, tax, accounting, and law enforcement obligations; and (i) establish, exercise, or defend legal claims.`,
      `Where required by law or our internal policy, we will seek consent before using personal data for a purpose that materially differs from the purpose for which it was originally collected.`,
      `If you do not provide certain personal data, we may be unable to onboard you, provide the Service, respond to enquiries, or comply with our contractual or legal obligations.`,
    ],
  },
  {
    id: "5",
    title: "Subscriber Customer and Employee Data",
    content: [
      `Our business subscribers may use the Service to input and manage personal data relating to their own customers, employees, contractors, and walk-in visitors. As between BarberPro and the relevant subscriber, the subscriber remains primarily responsible for that data, including the lawfulness of collection, notice, consent, accuracy, retention, disclosure, and handling of data subject rights under the PDPA or any other applicable law.`,
      `Where we process such subscriber-submitted data to host, secure, support, or make the Service available, we generally do so on the subscriber's behalf and in accordance with our service arrangements. We do not become responsible for the subscriber's underlying relationship with its own customers or staff merely because the subscriber uses our software.`,
      `Subscribers must not use the Service to process data unlawfully, deceptively, excessively, or without required notices or consents. We may suspend accounts or remove content where we reasonably believe continued processing creates legal, security, or reputational risk.`,
    ],
  },
  {
    id: "6",
    title: "Disclosure of Personal Data",
    content: [
      `We may disclose personal data to our affiliates, service providers, advisers, auditors, payment processors, cloud hosting providers, infrastructure vendors, communications providers, analytics providers, insurers, and professional advisers where reasonably necessary for the purposes described in this notice.`,
      `We may also disclose personal data where required or permitted by law, court order, regulatory requirement, lawful request from a competent authority, incident response requirement, merger or business transfer, financing transaction, or the protection of our rights, property, users, staff, or the public.`,
      `We do not sell your personal data for cash consideration. We do not permit third parties to use your personal data for their own unrelated marketing purposes except where you separately choose to engage with that third party.`,
    ],
  },
  {
    id: "7",
    title: "Cross-Border Transfers",
    content: [
      `The Service may be hosted, supported, backed up, or accessed through infrastructure and service providers located in or outside Malaysia. Accordingly, personal data may be transferred to, stored in, or accessed from jurisdictions outside Malaysia, including jurisdictions that may not provide the same statutory protections as Malaysia.`,
      `Where we arrange such transfers, we take reasonable steps to require appropriate confidentiality, security, and handling measures from relevant recipients, taking into account the nature of the data and the purpose of processing.`,
      `By using the Service or providing personal data to us, you acknowledge and, where required by law, consent to such cross-border transfers and related processing.`,
    ],
  },
  {
    id: "8",
    title: "Security and Retention",
    content: [
      `We implement reasonable administrative, organisational, physical, and technical safeguards designed to protect personal data against accidental or unlawful destruction, loss, misuse, alteration, unauthorised disclosure, or unauthorised access. Such safeguards may include access controls, role-based permissions, encryption in transit, monitoring, logging, backups, and vendor management processes.`,
      `No system, network, device, or transmission method is completely secure. Accordingly, while we take reasonable steps to protect personal data, we do not guarantee absolute security, uninterrupted availability, or immunity from cyber incidents.`,
      `We retain personal data for as long as reasonably necessary for the purpose for which it was collected, for our legitimate operational needs, for backup and continuity purposes, to resolve disputes, to enforce agreements, and to satisfy legal, accounting, audit, tax, or regulatory obligations. Retention periods may therefore vary by data category and context.`,
    ],
  },
  {
    id: "9",
    title: "Your Rights and Choices",
    content: [
      `Subject to applicable law, you may request access to personal data we hold about you, request correction of inaccurate or incomplete personal data, withdraw consent where processing is based on consent, and request that we limit or cease direct marketing communications. We may require sufficient information to verify identity and authority before acting on a request.`,
      `We may decline or limit a request to the extent permitted by law, including where the request is repetitive, impracticable, inconsistent with legal obligations, prejudicial to the rights of others, or otherwise exempt under the PDPA or other applicable laws.`,
      `To stop marketing emails, you may use the unsubscribe mechanism in the communication or contact us directly. Service, billing, legal, operational, and security notices may still be sent where necessary even if you opt out of marketing.`,
    ],
  },
  {
    id: "10",
    title: "Cookies and Product Analytics",
    content: [
      `Our websites and applications may use cookies, pixels, local storage, session technologies, and similar tools to remember preferences, authenticate sessions, analyse traffic, secure the Service, diagnose issues, and improve user experience.`,
      `You can manage certain cookie settings through your browser or device controls. However, disabling some technologies may affect functionality, sign-in persistence, security controls, or user experience.`,
      `Where non-essential cookies or similar technologies require consent under applicable law or our policy, we will seek that consent through the relevant interface before enabling them.`,
    ],
  },
  {
    id: "11",
    title: "Changes to This Policy and Contact Details",
    content: [
      `We may amend this Privacy Policy from time to time to reflect changes in the Service, our operations, technology, legal requirements, or risk posture. The updated version will take effect from the effective date stated on this page unless otherwise specified.`,
      `For privacy requests, complaints, or enquiries, please contact ${COMPANY_NAME}, ${COMPANY_ADDRESS}, email ${CONTACT_EMAIL}, or contact our privacy team at ${DPO_EMAIL}.`,
      `If you are dissatisfied with our response, you may also consider contacting the relevant Malaysian data protection authority or seeking independent legal advice where appropriate.`,
    ],
  },
];

const pdpaPrinciples = [
  { num: "1", name: "General", desc: "We process data only for lawful purposes" },
  { num: "2", name: "Notice & Choice", desc: "We explain collection and use" },
  { num: "3", name: "Disclosure", desc: "We disclose only as stated or required" },
  { num: "4", name: "Security", desc: "We use reasonable safeguards" },
  { num: "5", name: "Retention", desc: "We retain data only as needed" },
  { num: "6", name: "Data Integrity", desc: "We seek to keep data accurate" },
  { num: "7", name: "Access", desc: "We support lawful access and correction requests" },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      <section className="border-b border-white/5 bg-[#13161a] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
            Legal
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-gray-400">
            Effective Date: <span className="font-semibold text-white">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            This policy explains how BarberPro collects, uses, discloses, stores, and protects
            personal data in connection with its Malaysia-based software platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
            >
              Terms of Service →
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
            >
              Privacy Enquiries
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 bg-[#0d1013] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-sm font-semibold text-gray-400">
            This notice is written to align with the key principles of Malaysia's PDPA
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {pdpaPrinciples.map((p) => (
              <div key={p.num} className="rounded-xl border border-white/5 bg-[#13161a] p-3 text-center">
                <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37]/20 text-xs font-black text-[#d4af37]">
                  {p.num}
                </div>
                <p className="text-xs font-bold text-white">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Contents
                </p>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#section-${s.id}`}
                      className="block rounded-lg px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                      {s.id}. {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="space-y-10">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm text-gray-300">
                <p className="font-semibold text-blue-400">Privacy Notice</p>
                <p className="mt-1">
                  Business subscribers remain responsible for the lawfulness of customer and staff
                  data they collect and upload into BarberPro. This policy covers BarberPro's own
                  handling of personal data and our role in supporting the platform.
                </p>
              </div>

              {sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
                  <h2 className="text-xl font-black text-white">
                    {section.id}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((para, i) => (
                      <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-gray-400">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-white/5 pt-8 text-sm text-gray-500">
                <p>
                  This document was last updated on{" "}
                  <strong className="text-gray-400">{EFFECTIVE_DATE}</strong>. For privacy
                  enquiries, contact{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
