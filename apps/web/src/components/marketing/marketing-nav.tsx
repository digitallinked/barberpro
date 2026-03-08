"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors } from "lucide-react";

export function MarketingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navLinks = [
    { label: "Features", href: isHome ? "#features" : "/#features" },
    { label: "Pricing", href: isHome ? "#pricing" : "/#pricing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1013]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37]/20">
            <Scissors className="h-4 w-4 text-[#d4af37]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">
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
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-[#d4af37]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
