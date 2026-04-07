import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  title: "Terms of Service | BarberPro.my",
  description:
    "BarberPro.my Terms of Service for barber shop operators and other business subscribers using the BarberPro platform in Malaysia.",
};

const EFFECTIVE_DATE = "6 April 2026";
const COMPANY_NAME = "BARBERPRO TECHNOLOGIES";
const COMPANY_REG = "202603081534 (NS0320892-W)";
const COMPANY_ADDRESS =
  "No. 23, Jalan 2/2, Bandar Baru Bangi, 43650 Bandar Baru Bangi, Selangor, Malaysia";
const CONTACT_EMAIL = "legal@barberpro.my";

const sections = [
  {
    id: "1",
    title: "Scope, Parties, and Acceptance",
    content: [
      `${COMPANY_NAME} (Company No. ${COMPANY_REG}) ("BarberPro", "we", "us", or "our") provides the BarberPro software platform, websites, applications, application programming interfaces, communications, support services, and related tools (collectively, the "Service"). These Terms of Service ("Terms") form a legally binding agreement between BarberPro and the individual or legal entity that registers for, accesses, or uses the Service ("Subscriber", "you", or "your").`,
      `If you accept these Terms on behalf of a company, partnership, sole proprietorship, or other organisation, you represent and warrant that you have full authority to bind that entity, and references to "you" include that entity and its authorised users. If you do not have such authority, or if you do not agree with these Terms, you must not access or use the Service.`,
      `These Terms apply to all use of the Service by your owners, employees, contractors, temporary workers, franchisees, branch personnel, or any other person to whom you provide access ("Authorised Users"). You are responsible for ensuring that all Authorised Users comply with these Terms.`,
    ],
  },
  {
    id: "2",
    title: "Business Use and Nature of the Service",
    content: [
      `The Service is provided for business and operational use by barber shops, grooming businesses, and related commercial operators. The Service may include queue management, bookings, point-of-sale, customer records, loyalty, payroll or commission workflows, reporting, inventory, staff management, communications, and related administrative features.`,
      `The Service is a business tool only. It does not constitute legal advice, employment advice, accounting advice, tax advice, medical advice, financial advice, or regulatory advice. Any reports, calculations, suggestions, templates, reminders, analytics, defaults, automations, or workflows made available through the Service are provided for convenience only, and you remain solely responsible for reviewing them and for all decisions concerning your business operations, staffing, payroll, customer dealings, taxes, compliance, and record keeping.`,
      `We may add, remove, suspend, replace, improve, restrict, or discontinue any feature, integration, functionality, usage threshold, support channel, security control, or technical requirement at any time. We do not guarantee that any feature, roadmap item, integration, or release timing will continue to be offered.`,
    ],
  },
  {
    id: "3",
    title: "Accounts, Security, and Organisational Responsibility",
    content: [
      `You must provide true, accurate, current, and complete registration, billing, business, and contact information, and you must keep that information updated at all times. We may rely on the latest information in your account and communications records for notices, billing, enforcement, and service administration.`,
      `You are solely responsible for: (a) maintaining the confidentiality and security of account credentials, devices, networks, and access methods; (b) controlling who within your organisation can access the Service; (c) all activities that occur under your account; and (d) promptly notifying us of any suspected unauthorised use, compromise, or security incident. We may act on instructions submitted through your account credentials without independent verification.`,
      `You must not share credentials outside your organisation, create accounts through deception or automation, impersonate any person, or attempt to circumvent account, tenant, branch, subscription, or usage controls. We may require identity, business, or payment verification at any time.`,
    ],
  },
  {
    id: "4",
    title: "Orders, Subscription Plans, Fees, Taxes, and Price Changes",
    content: [
      `The Service is offered under plans, quotations, proposals, order forms, promotional offers, or billing screens made available by BarberPro from time to time. Unless expressly stated otherwise in writing, all subscriptions renew automatically for successive billing periods of the same duration as your then-current term.`,
      `All fees are payable in advance, in Malaysian Ringgit (MYR), and are exclusive of taxes, duties, levies, bank charges, and payment processing charges unless we expressly state otherwise. You are responsible for all sales, service, withholding, value added, goods and services, and similar taxes arising from your subscription or use of the Service, except taxes based on our net income.`,
      `We may change our pricing, plan structure, plan names, included features, usage allowances, support entitlements, overage rates, trial terms, promotional terms, and billing mechanics at any time. Updated prices or terms may apply immediately to new subscriptions, add-ons, usage-based charges, taxes, payment processor charges, or renewals. For material pricing changes affecting an existing paid plan, we will generally provide advance notice before the change takes effect at your next renewal or billing cycle, unless a shorter period is required by law, tax, processor requirements, currency movements, fraud prevention, or immediate security or operational necessity.`,
      `You authorise us and our payment processors to charge all subscription fees, renewals, add-on fees, overage charges, taxes, adjustments, chargeback-related fees, and other amounts due using your nominated payment method. If payment cannot be processed when due, we may suspend or downgrade the Service, restrict features, revoke access, or terminate your account without prejudice to any other rights or remedies available to us.`,
    ],
  },
  {
    id: "5",
    title: "Trials, Promotions, Credits, and Refund Policy",
    content: [
      `Any free trial, pilot, beta release, promotional credit, discount, migration assistance, or goodwill concession is offered at BarberPro's discretion, may be withdrawn or modified at any time, may be subject to additional conditions, and has no cash value unless expressly stated otherwise.`,
      `Except where non-excludable rights apply under Malaysian law or where we expressly agree otherwise in writing, all fees paid are non-cancellable and non-refundable, including fees paid for partial billing periods, unused licences, unused features, unused support, and early termination. Downgrades or cancellations take effect at the end of the then-current paid term unless we expressly state otherwise.`,
      `If we issue any refund, service credit, waiver, or billing adjustment in one case, that does not obligate us to issue the same or any similar refund, credit, waiver, or adjustment in any other case. Refunds or credits, if any, will be your sole and exclusive monetary remedy for the relevant issue.`,
    ],
  },
  {
    id: "6",
    title: "Subscriber Data, PDPA Compliance, and Records",
    content: [
      `As between the parties, you retain responsibility for all data, records, files, communications, documents, media, payroll details, customer details, employee details, inventory records, transaction details, and other information submitted to or generated through your use of the Service ("Subscriber Data"). You represent and warrant that you have all rights, notices, consents, permissions, licences, and lawful bases necessary to collect, use, disclose, transfer, and otherwise process Subscriber Data through the Service.`,
      `You remain solely responsible for your compliance with all laws applicable to your business and Subscriber Data, including the Personal Data Protection Act 2010, consumer protection laws, employment laws, tax laws, anti-money laundering rules, bookkeeping obligations, licensing obligations, and any sector-specific legal or regulatory requirements. You are responsible for providing your own privacy notices, obtaining valid consents where required, handling access and correction requests, and determining retention periods required for your business.`,
      `BarberPro may process certain Subscriber Data on your behalf for the purpose of providing, securing, supporting, and improving the Service. However, nothing in these Terms transfers your legal responsibility for the underlying lawfulness, quality, accuracy, completeness, retention, or use of Subscriber Data. You acknowledge that we are not your law firm, data protection officer, employer, accountant, payroll provider, or statutory filing agent.`,
    ],
  },
  {
    id: "7",
    title: "Acceptable Use and Prohibited Conduct",
    content: [
      `You must use the Service only for lawful internal business purposes and in compliance with these Terms, our documentation, and all applicable Malaysian laws and regulations. You must not use the Service in any manner that is fraudulent, misleading, abusive, defamatory, obscene, discriminatory, harassing, anti-competitive, or otherwise unlawful.`,
      `Without limiting the foregoing, you must not: (a) upload malware, malicious scripts, ransomware, or harmful code; (b) probe, scan, reverse engineer, disable, or attempt to defeat security, tenancy, authentication, or rate limits; (c) access or attempt to access another subscriber's data or environment; (d) use the Service to send spam or unauthorised marketing; (e) use the Service for unlawful surveillance or unlawful monitoring; (f) copy, resell, sublicense, rent, timeshare, bureau-host, or commercially exploit the Service for third parties without our prior written consent; or (g) use the Service in a manner that could damage the Service, our reputation, or other users.`,
      `We may monitor use of the Service for security, abuse prevention, compliance, and operational reasons. We may suspend, restrict, remove, or investigate any content, account, feature, branch, user, or activity that we reasonably believe breaches these Terms, creates risk, or may expose us or others to loss, liability, or harm.`,
    ],
  },
  {
    id: "8",
    title: "Third-Party Services, Hardware, and Communications",
    content: [
      `The Service may interoperate with or depend on third-party products and services, including payment processors, messaging channels, cloud hosting, operating systems, browsers, devices, barcode or receipt hardware, fiscal devices, e-wallets, telecommunications providers, and analytics tools. Such third-party products and services are not controlled by BarberPro and may change or cease functioning at any time.`,
      `We are not responsible for the acts, omissions, outages, accuracy, security, legality, pricing, terms, availability, support, or performance of any third-party product or service, nor for any fees charged by them. Your use of any third-party service is governed solely by that third party's terms, policies, and service levels.`,
      `You are solely responsible for procuring and maintaining all internet connectivity, devices, hardware, software, licences, browsers, peripherals, telecommunications, backups, and internal systems required for your use of the Service.`,
    ],
  },
  {
    id: "9",
    title: "Intellectual Property, Feedback, and Publicity",
    content: [
      `BarberPro and its licensors own all right, title, and interest in and to the Service, including all software, source and object code, interfaces, designs, layouts, workflows, documentation, data models, trademarks, trade names, logos, inventions, know-how, and improvements, together with all intellectual property rights therein. No ownership rights are transferred to you.`,
      `Subject to your compliance with these Terms and payment of all applicable fees, BarberPro grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable right during the applicable subscription term to access and use the Service for your internal business operations only.`,
      `If you provide suggestions, ideas, enhancement requests, comments, testimonials, case studies, or other feedback, you grant BarberPro a perpetual, irrevocable, worldwide, royalty-free right to use, modify, and exploit that feedback without restriction or compensation. Unless you instruct otherwise in writing, we may identify you by business name and logo as a customer in reasonable promotional materials.`,
    ],
  },
  {
    id: "10",
    title: "Confidentiality",
    content: [
      `Each party may receive non-public information relating to the other party's business, customers, technology, pricing, security, operations, or plans ("Confidential Information"). The receiving party must use the disclosing party's Confidential Information only as necessary to perform or exercise its rights under these Terms and must protect it using at least reasonable care.`,
      `Confidential Information does not include information that is or becomes public through no breach of these Terms, was already lawfully known to the receiving party without confidentiality obligations, is independently developed without use of the disclosing party's Confidential Information, or is lawfully received from a third party without restriction.`,
      `A party may disclose Confidential Information where required by applicable law, regulation, court order, stock exchange requirement, or governmental authority, provided that, where legally permitted, it gives prior notice so the other party may seek protective relief.`,
    ],
  },
  {
    id: "11",
    title: "Suspension, Termination, and Data Access After Termination",
    content: [
      `We may suspend or restrict access to any part of the Service immediately, with or without prior notice, if we reasonably believe that: (a) you have breached these Terms; (b) your use creates security, legal, payment, reputational, or operational risk; (c) fees are overdue; (d) a law, regulator, court, payment processor, or government authority requires or expects us to act; or (e) continued provision of the Service is not commercially, technically, or legally viable.`,
      `You may terminate your subscription by following the cancellation mechanism we make available or by written notice to us. Termination or cancellation does not relieve you of any obligation to pay fees accrued before the effective date of termination, nor does it create any right to refund unless expressly required by applicable law.`,
      `Following termination, we may delete or anonymise Subscriber Data in accordance with our retention practices and operational timelines. It is your responsibility to export any Subscriber Data you require before your access ends. We are not liable for any loss arising from your failure to maintain your own independent backups or records.`,
    ],
  },
  {
    id: "12",
    title: "Disclaimers",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED "AS IS", "AS AVAILABLE", AND "WITH ALL FAULTS". BARBERPRO DISCLAIMS ALL WARRANTIES, REPRESENTATIONS, CONDITIONS, AND UNDERTAKINGS OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, SATISFACTORY QUALITY, ACCURACY, OR QUIET ENJOYMENT.`,
      `WITHOUT LIMITING THE FOREGOING, BARBERPRO DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, TIMELY, OR COMPATIBLE WITH YOUR PARTICULAR BUSINESS MODEL, HARDWARE, SOFTWARE, DEVICE, TAX POSITION, EMPLOYMENT STRUCTURE, OR REGULATORY REQUIREMENTS. WE DO NOT WARRANT THE ACCURACY OF REPORTS, PAYROLL OR COMMISSION OUTPUTS, INVENTORY FIGURES, CUSTOMER MESSAGES, QUEUE ESTIMATES, SALES DATA, TAX TREATMENT, OR ANY BUSINESS DECISION YOU MAKE USING THE SERVICE.`,
      `You acknowledge that software and online services are not error-free and that prudent business practice requires you to maintain independent judgment, independent backups, and appropriate manual checks. Nothing in these Terms excludes any guarantee, warranty, or right that cannot lawfully be excluded under Malaysian law.`,
    ],
  },
  {
    id: "13",
    title: "Limitation of Liability",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BARBERPRO AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL LOSS OR DAMAGE, OR FOR ANY LOSS OF REVENUE, PROFITS, BUSINESS, ANTICIPATED SAVINGS, GOODWILL, DATA, CUSTOMERS, OR BUSINESS OPPORTUNITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGE.`,
      `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BARBERPRO'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THE SERVICE OR THESE TERMS, WHETHER IN CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, STATUTE, OR OTHERWISE, WILL NOT EXCEED THE TOTAL SUBSCRIPTION FEES ACTUALLY PAID BY YOU TO BARBERPRO FOR THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.`,
      `Nothing in these Terms limits or excludes liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability that cannot lawfully be limited or excluded under Malaysian law.`,
    ],
  },
  {
    id: "14",
    title: "Indemnity",
    content: [
      `You must indemnify, defend, and hold harmless BarberPro and its related corporations, officers, directors, employees, agents, contractors, licensors, and service providers from and against all claims, actions, investigations, losses, liabilities, damages, judgments, penalties, fines, costs, and expenses (including reasonable solicitors' fees on a full indemnity basis) arising out of or relating to: (a) your breach of these Terms; (b) your business operations; (c) Subscriber Data; (d) your dealings with customers, employees, contractors, suppliers, or regulators; (e) your violation of law; or (f) any allegation that your data, content, conduct, or use of the Service infringes or misappropriates any rights of a third party.`,
    ],
  },
  {
    id: "15",
    title: "Changes, Governing Law, Disputes, and General",
    content: [
      `We may amend these Terms at any time by posting an updated version on the Service, by email, or through another reasonable notice mechanism. Unless a shorter period is required for security, legal, or operational reasons, material changes will generally take effect on the stated effective date. Your continued access to or use of the Service after the effective date constitutes acceptance of the revised Terms.`,
      `These Terms are governed by the laws of Malaysia. The parties must first attempt in good faith to resolve any dispute by negotiation. If the dispute is not resolved within thirty (30) days after written notice, either party may refer the dispute to the Asian International Arbitration Centre (AIAC) in Kuala Lumpur, Malaysia for final resolution under the applicable AIAC rules. The seat of arbitration will be Kuala Lumpur and the language will be English. Notwithstanding the foregoing, BarberPro may seek injunctive or equitable relief in any court of competent jurisdiction to protect its confidential information, security, platform integrity, or intellectual property.`,
      `If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in full force. Our failure to enforce any provision is not a waiver. You may not assign or transfer these Terms without our prior written consent. BarberPro may assign these Terms, in whole or in part, to an affiliate, purchaser, successor, or financing party. These Terms, together with our Privacy Policy and any applicable order form or plan-specific terms, constitute the entire agreement between the parties concerning the Service.`,
      `For legal notices and enquiries, contact ${COMPANY_NAME}, ${COMPANY_ADDRESS}, or email ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      <section className="border-b border-white/5 bg-[#13161a] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold text-[#d4af37]">
            Legal
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-gray-400">
            Effective Date: <span className="font-semibold text-white">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            These terms govern use of BarberPro.my by barber shop operators and other business
            subscribers in Malaysia.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
            >
              Privacy Policy →
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
            >
              Legal Enquiries
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Table of Contents
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
              <div className="rounded-2xl border border-[#d4af37]/20 bg-[#1a1400] p-5 text-sm text-gray-300">
                <p className="font-semibold text-[#d4af37]">Important Notice</p>
                <p className="mt-1">
                  BarberPro may revise features, plans, prices, usage allowances, support scope,
                  and these Terms from time to time. Continued use of the Service after the
                  effective date of any revision constitutes acceptance of the revised terms.
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
                  <strong className="text-gray-400">{EFFECTIVE_DATE}</strong>. For legal
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
