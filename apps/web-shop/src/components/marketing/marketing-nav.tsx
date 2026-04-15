"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Scissors, X } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

const SCROLL_DOWN_HIDE_AFTER = 64;
/** Spacer until ResizeObserver runs (avoids content under fixed bar on first paint). */
const NAV_HEIGHT_FALLBACK_PX = 72;

export function MarketingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollHidden, setIsScrollHidden] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const t = useT();
  const m = t.marketing;

  const navLinks = [
    { label: m.navFeatures, href: isHome ? "#features" : "/#features" },
    { label: m.navPricing, href: isHome ? "#pricing" : "/#pricing" },
    { label: m.navAbout, href: "/about" },
    { label: m.navContact, href: "/contact" },
  ];

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsScrollHidden(false);
      return;
    }

    const onScroll = () => {
      const y = window.scrollY;
      if (y < SCROLL_DOWN_HIDE_AFTER) {
        setIsScrollHidden(false);
      } else if (y > lastScrollY.current) {
        setIsScrollHidden(true);
      } else {
        setIsScrollHidden(false);
      }
      lastScrollY.current = y;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobileMenuOpen]);

  return (
    <>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: headerHeight > 0 ? headerHeight : NAV_HEIGHT_FALLBACK_PX }}
      />
      <div
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0d1013]/95 backdrop-blur transition-transform duration-300 ease-out will-change-transform",
          isScrollHidden && !isMobileMenuOpen && "-translate-y-full",
        )}
      >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37]/20">
            <Scissors className="h-4 w-4 text-[#d4af37]" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">
              BarberPro<span className="text-[#d4af37]">.my</span>
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
              Malaysia&apos;s #1 Barber Platform
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            {m.navLogIn}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
          >
            {m.navStartTrial}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition hover:border-white/20 hover:text-white md:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-white/5 bg-[#0d1013] px-4 pb-4 sm:px-6 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-[#d4af37]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex justify-center">
            <LanguageSwitcher />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {m.navLogIn}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#d4af37] px-3 py-2 text-center text-sm font-bold text-black transition hover:brightness-110"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {m.navStartTrial}
            </Link>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
