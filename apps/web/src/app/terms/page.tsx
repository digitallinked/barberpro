import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Terms of Service | BarberPro.my",
  description:
    "BarberPro.my Terms of Service — governing your use of Malaysia's premier barber shop management platform."
};

const EFFECTIVE_DATE = "1 January 2025";
const COMPANY_NAME = "BarberPro Technologies Sdn. Bhd.";
const COMPANY_REG = "[SSM Registration No. to be inserted]";
const COMPANY_ADDRESS =
  "Level 12, Menara XYZ, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia";
const CONTACT_EMAIL = "legal@barberpro.my";
const APP_URL = "https://barberpro.my";

const sections = [
  {
    id: "1",
    title: "Parties and Acceptance",
    content: [
      `These Terms of Service ("Terms") constitute a legally binding agreement between ${COMPANY_NAME} (Company No. ${COMPANY_REG}) ("BarberPro", "we", "us", or "our"), a company incorporated in Malaysia under the Companies Act 2016, and you ("User", "Subscriber", or "you"), being the person or legal entity accessing or using the BarberPro.my platform and related services (collectively, the "Service").`,
      `By registering for, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy (incorporated herein by reference). If you are entering into these Terms on behalf of a business or other legal entity, you represent that you have the authority to bind that entity to these Terms.`,
      `If you do not agree to any part of these Terms, you must immediately cease using the Service and delete your account.`
    ]
  },
  {
    id: "2",
    title: "Description of Service",
    content: [
      `BarberPro.my provides a cloud-based Software-as-a-Service (SaaS) platform designed for barber shop businesses in Malaysia. The Service includes but is not limited to: queue management, point-of-sale (POS), appointment scheduling, payroll and commission calculation, inventory management, customer relationship management (CRM), financial reporting, and multi-branch management.`,
      `We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice. BarberPro.my shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.`
    ]
  },
  {
    id: "3",
    title: "Account Registration and Security",
    content: [
      `To access the Service, you must register for an account by providing accurate, current, and complete information. You agree to update your information to keep it accurate and current throughout the duration of your subscription.`,
      `You are solely responsible for maintaining the confidentiality of your account credentials (username and password) and for all activities that occur under your account. You must immediately notify us at ${CONTACT_EMAIL} if you suspect any unauthorised access to or use of your account.`,
      `You must not: (a) share your login credentials with any person outside your organisation; (b) create accounts by automated means or under false pretences; (c) use another person's account without authorisation. BarberPro.my will not be liable for any loss or damage arising from your failure to comply with these security obligations.`,
      `You must be at least 18 years of age to register for an account. By registering, you represent and warrant that you meet this requirement.`
    ]
  },
  {
    id: "4",
    title: "Subscription Plans and Fees",
    content: [
      `Access to the Service is available on a subscription basis. Current pricing plans and fees are published at ${APP_URL}/#pricing and may be updated from time to time. All prices are quoted in Malaysian Ringgit (MYR) and are subject to applicable taxes, including Service Tax as required under the Service Tax Act 2018.`,
      `Subscription fees are billed monthly or annually in advance depending on the plan chosen. Payments are processed on the billing date unless cancelled before that date.`,
      `A 14-day free trial may be offered to new subscribers at our discretion. No credit card is required during the trial period. Upon expiry of the free trial, access will require a paid subscription.`,
      `All fees paid are non-refundable except as expressly stated in Section 5 (Cancellation and Refunds) or as required by applicable Malaysian law. BarberPro.my reserves the right to modify its pricing with 30 days' prior written notice to existing subscribers.`,
      `In the event of non-payment, BarberPro.my may suspend your access to the Service after providing reasonable notice. Suspended accounts will have their data retained for 90 days, after which the data may be permanently deleted.`
    ]
  },
  {
    id: "5",
    title: "Cancellation and Refunds",
    content: [
      `You may cancel your subscription at any time through your account settings or by contacting us at ${CONTACT_EMAIL}. Upon cancellation, your subscription will remain active until the end of the current billing period. No partial refunds are provided for unused periods within a billing cycle.`,
      `Annual subscriptions may qualify for a pro-rata refund of the unused months if cancelled within 30 days of the annual renewal date, provided the account has not been in breach of these Terms.`,
      `Notwithstanding the above, if the Service has a material defect or outage of more than 24 consecutive hours attributable to BarberPro.my, you may request a service credit equivalent to the affected period. BarberPro.my's liability for service credits shall not exceed the total fees paid by you in the preceding one (1) calendar month.`,
      `Upon cancellation or termination, you may export your data in a standard format (CSV or PDF) within 30 days of cancellation. After 30 days, your data will be permanently deleted from our systems.`
    ]
  },
  {
    id: "6",
    title: "Acceptable Use",
    content: [
      `You agree to use the Service only for lawful purposes and in compliance with all applicable Malaysian laws and regulations, including but not limited to: the Communications and Multimedia Act 1998, the Computer Crimes Act 1997, the Personal Data Protection Act 2010, the Contracts Act 1950, and the Consumer Protection Act 1999.`,
      `You must not: (a) use the Service to engage in any unlawful, fraudulent, deceptive, or harmful activity; (b) process, store, or transmit any data that infringes any intellectual property rights or violates any person's privacy or dignity; (c) upload, transmit, or distribute malicious code, viruses, or other harmful software; (d) attempt to gain unauthorised access to any part of the Service or its underlying infrastructure; (e) use the Service to spam, phish, or send unsolicited communications; (f) reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service; (g) resell, sublicense, or make the Service available to third parties without our express written consent.`,
      `BarberPro.my reserves the right to suspend or terminate your account immediately and without prior notice if we determine, in our reasonable discretion, that you have violated these acceptable use provisions.`
    ]
  },
  {
    id: "7",
    title: "Intellectual Property",
    content: [
      `The Service, including all software, algorithms, code, user interfaces, text, graphics, images, and other content, is owned by BarberPro.my and its licensors and is protected by applicable Malaysian and international intellectual property laws.`,
      `We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service solely for your internal business purposes in accordance with these Terms. No other rights are granted.`,
      `You retain ownership of all data, content, and information that you submit, upload, or store through the Service ("Your Data"). By using the Service, you grant BarberPro.my a limited licence to process, store, and transmit Your Data solely as necessary to provide the Service to you.`,
      `You must not remove, alter, or obscure any copyright, trademark, or other proprietary notices on or within the Service.`
    ]
  },
  {
    id: "8",
    title: "Data Protection and Privacy",
    content: [
      `BarberPro.my processes personal data in accordance with Malaysia's Personal Data Protection Act 2010 ("PDPA"). Our full Privacy Policy, which explains how we collect, use, store, and disclose personal data, is available at ${APP_URL}/privacy and forms part of these Terms.`,
      `As a Subscriber, you are a Data User (as defined under the PDPA) in respect of the personal data of your customers and employees that you process through the Service. You are solely responsible for ensuring your use of the Service complies with your obligations under the PDPA and any other applicable data protection laws.`,
      `You represent and warrant that you have obtained all necessary consents and are otherwise lawfully entitled to collect, process, and submit to the Service any personal data that you input into or transmit through the Service.`
    ]
  },
  {
    id: "9",
    title: "Disclaimer of Warranties",
    content: [
      `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OR ERROR-FREE OPERATION.`,
      `BarberPro.my does not warrant that: (a) the Service will meet your specific business requirements; (b) the Service will be continuously available or free from technical errors; (c) any financial calculations, reports, or outputs generated by the Service are accurate, complete, or suitable for any regulatory, tax, or legal purpose. You are advised to independently verify any critical financial or business data generated by the Service.`,
      `Nothing in these Terms shall exclude any warranty or right that cannot lawfully be excluded under Malaysian consumer protection legislation.`
    ]
  },
  {
    id: "10",
    title: "Limitation of Liability",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE MALAYSIAN LAW, IN NO EVENT SHALL BARBERPRO.MY, ITS DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY: (A) INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES; (B) LOSS OF PROFITS, REVENUE, DATA, BUSINESS, OR GOODWILL; (C) BUSINESS INTERRUPTION OR LOSS OF BUSINESS OPPORTUNITY, WHETHER ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE USE OF (OR INABILITY TO USE) THE SERVICE, EVEN IF BARBERPRO.MY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`,
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARBERPRO.MY'S TOTAL CUMULATIVE LIABILITY TO YOU ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL SUBSCRIPTION FEES PAID BY YOU TO BARBERPRO.MY IN THE THREE (3) CALENDAR MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.`,
      `Nothing in these Terms shall limit or exclude liability for: (a) death or personal injury caused by negligence; (b) fraud or fraudulent misrepresentation; or (c) any other liability that cannot be excluded or limited under Malaysian law.`
    ]
  },
  {
    id: "11",
    title: "Indemnification",
    content: [
      `You agree to indemnify, defend, and hold harmless BarberPro.my and its officers, directors, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of the Service in violation of these Terms; (b) Your Data, including any claim that Your Data infringes any third-party intellectual property or privacy rights; (c) your violation of any applicable law or regulation; or (d) any claim by a third party arising out of your use of the Service.`
    ]
  },
  {
    id: "12",
    title: "Third-Party Services and Integrations",
    content: [
      `The Service may integrate with or link to third-party services, including but not limited to payment processors (e.g., DuitNow, FPX, e-wallets), messaging platforms (e.g., WhatsApp), and analytics tools. BarberPro.my is not responsible for the practices, policies, or content of such third-party services.`,
      `Your use of any third-party service through the Service is governed by the terms and privacy policies of that third party. BarberPro.my shall not be liable for any damage or loss arising from your use of or reliance on any third-party service.`
    ]
  },
  {
    id: "13",
    title: "Confidentiality",
    content: [
      `Each party agrees to keep confidential any non-public information disclosed by the other party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure ("Confidential Information").`,
      `Neither party shall disclose the other's Confidential Information to any third party without prior written consent, except as required by applicable law, court order, or regulatory authority. In such case, the disclosing party shall provide the other party with prompt written notice (to the extent permitted by law) to allow the other party to seek a protective order.`
    ]
  },
  {
    id: "14",
    title: "Term and Termination",
    content: [
      `These Terms commence on the date you first access the Service and continue until your subscription is cancelled or terminated in accordance with these Terms.`,
      `BarberPro.my may terminate your account and these Terms immediately upon written notice if: (a) you materially breach any provision of these Terms and fail to cure such breach within 14 days of receiving written notice; (b) you are subject to insolvency, bankruptcy, or receivership proceedings; or (c) BarberPro.my is required to do so by law or court order.`,
      `Upon termination: (a) your right to access the Service will cease immediately; (b) all provisions of these Terms that by their nature should survive termination shall survive, including without limitation ownership provisions, warranty disclaimers, indemnity obligations, and limitations of liability.`
    ]
  },
  {
    id: "15",
    title: "Governing Law and Dispute Resolution",
    content: [
      `These Terms shall be governed by and construed in accordance with the laws of Malaysia, without regard to its conflict of law principles.`,
      `In the event of any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or validity thereof ("Dispute"), the parties shall first attempt to resolve the Dispute through good-faith negotiation for a period of 30 days from the date of written notice of the Dispute.`,
      `If the Dispute is not resolved through negotiation, either party may refer the Dispute to mediation administered by the Asian International Arbitration Centre (AIAC) in Kuala Lumpur in accordance with its Mediation Rules.`,
      `If mediation fails, the Dispute shall be finally resolved by arbitration administered by the AIAC in accordance with its Arbitration Rules. The seat of arbitration shall be Kuala Lumpur, Malaysia. The language of the proceedings shall be English. The arbitral award shall be final and binding.`,
      `Notwithstanding the above, either party may seek emergency injunctive or other equitable relief from any court of competent jurisdiction in Malaysia to prevent irreparable harm pending final resolution of a Dispute.`
    ]
  },
  {
    id: "16",
    title: "Changes to These Terms",
    content: [
      `BarberPro.my reserves the right to modify these Terms at any time. We will notify you of material changes by: (a) sending an email to the address associated with your account; and/or (b) posting a prominent notice within the Service.`,
      `Changes will take effect 30 days after notification. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must cancel your subscription before the effective date.`
    ]
  },
  {
    id: "17",
    title: "General Provisions",
    content: [
      `Entire Agreement: These Terms, together with the Privacy Policy and any other documents expressly incorporated by reference, constitute the entire agreement between the parties with respect to the Service and supersede all prior agreements, representations, and understandings.`,
      `Severability: If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.`,
      `Waiver: BarberPro.my's failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.`,
      `No Assignment: You may not assign or transfer any of your rights or obligations under these Terms without the prior written consent of BarberPro.my. BarberPro.my may freely assign these Terms.`,
      `Force Majeure: Neither party shall be liable for any delay or failure in performance resulting from events beyond their reasonable control, including acts of God, natural disasters, government actions, power failures, or internet disruptions.`,
      `Language: In the event of any conflict between the English version and any translated version of these Terms, the English version shall prevail.`
    ]
  },
  {
    id: "18",
    title: "Contact Information",
    content: [
      `For any questions or concerns regarding these Terms, please contact us:`,
      `${COMPANY_NAME}\n${COMPANY_ADDRESS}\nEmail: ${CONTACT_EMAIL}\nWebsite: ${APP_URL}`
    ]
  }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* ── Header ── */}
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
            Please read these terms carefully before using BarberPro.my. By accessing or using the Service,
            you agree to be bound by these Terms.
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

      {/* ── Content ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">

            {/* Table of Contents */}
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

            {/* Body */}
            <div className="space-y-10">
              <div className="rounded-2xl border border-[#d4af37]/20 bg-[#1a1400] p-5 text-sm text-gray-300">
                <p className="font-semibold text-[#d4af37]">Important Notice</p>
                <p className="mt-1">
                  These Terms of Service are governed by the laws of Malaysia. By using BarberPro.my,
                  you submit to the exclusive jurisdiction of the courts and arbitration bodies of Malaysia
                  for the resolution of any disputes.
                </p>
              </div>

              {sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
                  <h2 className="text-xl font-black text-white">
                    {section.id}. {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-gray-400 whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-white/5 pt-8 text-sm text-gray-500">
                <p>
                  This document was last updated on <strong className="text-gray-400">{EFFECTIVE_DATE}</strong>.
                  For any legal enquiries, please contact {" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#d4af37] hover:underline">{CONTACT_EMAIL}</a>.
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
