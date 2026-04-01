"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "./language-switcher";

export function NavDesktopLinks() {
  const t = useT();

  return (
    <nav className="hidden items-center gap-5 md:flex">
      <Link
        href="/shops"
        className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
      >
        {t.nav.findShops}
      </Link>
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
      >
        {t.nav.howItWorks}
      </Link>
      <Link
        href="/styles"
        className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
      >
        {t.nav.styles}
      </Link>
      <Link
        href="/subscription"
        className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
      >
        {t.nav.plus}
      </Link>
      <LanguageSwitcher />
    </nav>
  );
}
