import Link from "next/link";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Demo", href: "/dashboard" },
      { label: "Updates", href: "/updates" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/help" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" }
    ]
  }
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0c0f]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-base font-bold text-white">
              BarberPro<span className="text-[#d4af37]">.my</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-gray-400">
              Malaysia&apos;s premier barber shop management platform. From queue to payout, manage everything in one place.
            </p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 font-bold text-white">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition hover:text-[#d4af37]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} BarberPro Technologies Sdn. Bhd. All rights reserved.</p>
        <p className="mt-1">
          Made with <span className="text-red-500">♥</span> in Malaysia &nbsp;|&nbsp;{" "}
          <Link href="/terms" className="hover:text-gray-400 transition">Terms</Link>
          {" · "}
          <Link href="/privacy" className="hover:text-gray-400 transition">Privacy</Link>
        </p>
      </div>
    </footer>
  );
}
