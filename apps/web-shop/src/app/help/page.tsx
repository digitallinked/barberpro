import Link from "next/link";
import {
  BarChart2,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  MessageCircle,
  Package,
  Timer,
  Users
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/lib/seo";

const HELP_TITLE = "Help Center | BarberPro.my";
const HELP_DESC =
  "Find answers to common questions about BarberPro.my — Malaysia's barber shop management platform.";

export const metadata = marketingPageMetadata("/help", HELP_TITLE, HELP_DESC);

const categories = [
  { icon: Timer, iconBg: "bg-orange-500/20", iconColor: "text-orange-400", label: "Queue Management", count: 6 },
  { icon: CreditCard, iconBg: "bg-green-500/20", iconColor: "text-green-400", label: "POS & Payments", count: 7 },
  { icon: DollarSign, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", label: "Payroll & Commission", count: 5 },
  { icon: Package, iconBg: "bg-purple-500/20", iconColor: "text-purple-400", label: "Inventory", count: 4 },
  { icon: CalendarDays, iconBg: "bg-teal-500/20", iconColor: "text-teal-400", label: "Appointments", count: 5 },
  { icon: Users, iconBg: "bg-pink-500/20", iconColor: "text-pink-400", label: "Customer CRM", count: 4 },
  { icon: BarChart2, iconBg: "bg-yellow-500/20", iconColor: "text-yellow-400", label: "Reports & Analytics", count: 5 },
  { icon: Building2, iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400", label: "Multi-Branch", count: 4 }
];

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I start my free trial?",
        a: "Click 'Start Free Trial' on the homepage, enter your email and shop name, and you're in. No credit card required. Your 14-day trial gives you full access to all features on the Professional plan."
      },
      {
        q: "How long does setup take?",
        a: "Most shops complete setup in under 30 minutes. You'll add your shop name, set up your services (with prices), add your barbers, and you're ready to take the first queue entry."
      },
      {
        q: "Can I import my existing customer data?",
        a: "Yes. You can upload a CSV file with your customer records (name, phone number, visit history) or we can help you migrate manually. Contact our team at hello@barberpro.my and we'll assist you."
      },
      {
        q: "Do you offer onboarding support?",
        a: "Absolutely. Every new subscriber gets a free onboarding session via WhatsApp or video call. Our team walks you through the system step by step in Bahasa Malaysia or English, whichever you prefer."
      }
    ]
  },
  {
    category: "Queue Management",
    questions: [
      {
        q: "How do I add a walk-in customer to the queue?",
        a: "On the Queue screen, tap the '+ Add Walk-In' button. Enter the customer's name (or leave blank for anonymous), select the service, choose a preferred barber (or auto-assign), and tap Confirm. The customer appears on the queue board instantly."
      },
      {
        q: "Can customers see the queue from their phone?",
        a: "Yes. You can share a public queue link that customers can open on their phone to see their position and estimated wait time. No app download required. It works in any mobile browser."
      },
      {
        q: "How does the TV display board work?",
        a: "Go to Settings > Queue Display and copy the display URL. Open this URL on any TV or large screen (using a Chromecast or HDMI cable). The board auto-refreshes and shows the current queue status."
      },
      {
        q: "Can I set different queues per barber?",
        a: "Currently all staff share a single queue for the branch. You can assign a preferred barber when adding a walk-in ticket, and the system tracks who served each customer. Per-barber queue mode is planned for a future update."
      }
    ]
  },
  {
    category: "POS & Payments",
    questions: [
      {
        q: "What payment methods does the POS support?",
        a: "BarberPro.my POS supports Cash and DuitNow QR payments. Additional payment methods (card terminal, e-wallets) can be recorded under Cash or QR as needed. More dedicated payment integrations are planned."
      },
      {
        q: "How does DuitNow QR work?",
        a: "At checkout, select 'DuitNow QR'. The customer pays using any Malaysian bank app or e-wallet by scanning your shop's DuitNow QR code. You then upload a photo of the payment confirmation as a proof of payment before completing the transaction."
      },
      {
        q: "Can I apply member discounts at checkout?",
        a: "Yes. Manual discounts can be applied at the checkout screen, and customers earn loyalty points with each visit that can be tracked in the Customers section."
      },
      {
        q: "Are receipts sent automatically?",
        a: "After every checkout, the transaction is recorded in the system and visible in the Reports section. You can review the full itemised breakdown there. WhatsApp and email receipt delivery are planned for a future update."
      },
      {
        q: "Is the POS system offline-capable?",
        a: "The POS requires an active internet connection to process payments and sync data. Offline mode is on our roadmap for a future update."
      }
    ]
  },
  {
    category: "Payroll & Commission",
    questions: [
      {
        q: "What commission models does BarberPro.my support?",
        a: "You can configure: (1) Fixed salary only, (2) Commission-per-service (flat rate per cut), (3) Percentage of revenue, (4) Tiered commission (higher % after a target is hit), and (5) Any combination of the above. Each barber can have a different structure."
      },
      {
        q: "How is payroll calculated?",
        a: "At the end of each pay period (weekly, bi-weekly, or monthly), the system totals each barber's completed services and calculates their commission automatically based on your rules. You review, approve, and can export the payroll summary to PDF."
      },
      {
        q: "Can barbers see their own earnings?",
        a: "Shop owners can view per-barber earnings breakdowns in the Payroll and Commission sections of the dashboard. Individual barber logins for self-service earnings tracking are planned for a future mobile staff app."
      },
      {
        q: "Does BarberPro.my handle EPF and SOCSO deductions?",
        a: "The payroll module shows gross earnings and allows you to input statutory deductions (EPF, SOCSO, EIS, PCB) manually. Automated calculation of statutory contributions based on up-to-date rates is on our roadmap for Q3 2025."
      }
    ]
  },
  {
    category: "Account & Billing",
    questions: [
      {
        q: "How do I upgrade or downgrade my plan?",
        a: "Go to Settings > Subscription. You can change your plan at any time. Upgrades take effect immediately (with a pro-rata charge). Downgrades take effect at the next billing cycle."
      },
      {
        q: "What happens if I miss a payment?",
        a: "We'll send an email reminder. Your account stays active for 7 days after a missed payment. After that, access is suspended (but your data is preserved for 90 days). You can resume at any time by updating your payment method."
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, cancel anytime from Settings > Subscription. There are no cancellation fees. Your access continues until the end of the paid period. You can export all your data before cancelling."
      },
      {
        q: "Is there a discount for annual subscriptions?",
        a: "All plans are currently billed monthly. Annual billing with a discount (2 months free) is planned and will be available in a future update."
      }
    ]
  },
  {
    category: "Security & Data",
    questions: [
      {
        q: "Is my data safe?",
        a: "Yes. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Our servers are hosted on enterprise cloud infrastructure with daily automated backups. We comply with Malaysia's Personal Data Protection Act 2010."
      },
      {
        q: "Who has access to my shop's data?",
        a: "Only you and your staff members (with the roles you assign) can access your shop's data. BarberPro.my staff may access your data only to provide technical support and only with your permission."
      },
      {
        q: "Can I export all my data?",
        a: "Yes. In the Reports section you can download transaction summaries, payroll reports, and P&L statements as CSV or PDF. A dedicated full-data export tool (Settings > Data Export) is on our roadmap."
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#0d1013] font-sans">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#0d1013] py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-white sm:text-5xl">Help Center</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Find answers to common questions about BarberPro.my. Can&apos;t find what you&apos;re looking for?
            Contact us directly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/60123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Support
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              Send Us a Message
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="border-y border-white/5 bg-[#13161a] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-sm font-semibold text-gray-400">Browse by Category</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-[#0d0d0d] p-4 text-center transition hover:border-[#d4af37]/20"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.iconBg}`}>
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                </div>
                <p className="text-xs font-semibold text-white leading-tight">{cat.label}</p>
                <p className="text-[10px] text-gray-600">{cat.count} articles</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Sections ── */}
      <section className="bg-[#0d1013] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-14">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="mb-6 text-xl font-black text-white">{section.category}</h2>
                <div className="space-y-3">
                  {section.questions.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-2xl border border-white/5 bg-[#13161a]"
                    >
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-200 select-none group-open:text-[#d4af37]">
                        <span className="flex items-center justify-between gap-3">
                          {item.q}
                          <span className="shrink-0 text-lg leading-none text-gray-500 group-open:text-[#d4af37]">+</span>
                        </span>
                      </summary>
                      <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-gray-400">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Still Need Help ── */}
      <section className="bg-[#13161a] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-white">Still Need Help?</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Our support team is available Monday to Friday, 9am–6pm MYT.
            For urgent issues, WhatsApp is the fastest way to reach us.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/60123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-8 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-8 py-3.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              Email Support
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-600">
            You can also reach us at{" "}
            <a href="mailto:hello@barberpro.my" className="text-[#d4af37] hover:underline">
              hello@barberpro.my
            </a>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
