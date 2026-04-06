"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

export function Footer() {
  const t = useT();

  const footerGroups = [
    {
      title: t.footer.discover,
      links: [
        { label: t.footer.findShops, href: "/shops" },
        { label: t.footer.howItWorks, href: "/how-it-works" },
        { label: t.footer.browseNearMe, href: "/shops" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: t.footer.account,
      links: [
        { label: t.footer.myProfile, href: "/profile" },
        { label: t.footer.barberProPlus, href: "/subscription" },
        { label: t.footer.signUpFree, href: "/signup" },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.forBusinesses, href: "/for-businesses" },
        { label: t.footer.privacyPolicy, href: "/privacy" },
        { label: t.footer.termsOfService, href: "/terms" },
      ],
    },
  ];

  return (
    <>
      {/* Spacer that reserves space for the fixed bottom nav on mobile */}
      <div
        className="h-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))] md:hidden"
        aria-hidden
      />

      {/* Full footer — desktop only */}
      <footer className="hidden border-t border-white/5 bg-[#0a0c0f] md:block">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37]/20">
                  <Scissors className="h-3.5 w-3.5 text-[#d4af37]" />
                </div>
                <p className="text-sm font-bold text-white">
                  BarberPro<span className="text-[#d4af37]">.my</span>
                </p>
              </div>
              <p className="mt-3 max-w-xs text-sm text-gray-400">
                {t.footer.tagline}
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 font-bold text-white">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
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
          <p>
            &copy; {new Date().getFullYear()} barberpro.my{" "}
            {t.footer.allRightsReserved}
          </p>
          <p className="mt-1">
            {t.footer.madeInMalaysia}
            &nbsp;|&nbsp;{" "}
            <Link href="/terms" className="transition hover:text-gray-400">
              {t.footer.terms}
            </Link>
            {" · "}
            <Link href="/privacy" className="transition hover:text-gray-400">
              {t.footer.privacy}
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}
