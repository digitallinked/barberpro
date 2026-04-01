"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  CalendarClock,
  Home,
  LogIn,
  LogOut,
  MoreHorizontal,
  Newspaper,
  Scissors,
  Search,
  Settings,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type Props = {
  isLoggedIn: boolean;
  customerName: string | null;
};

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Find Shops", href: "/shops", icon: Search },
  { label: "Styles", href: "/styles", icon: Sparkles },
  { label: "Bookings", href: "/bookings", icon: CalendarClock },
] as const;

function MoreSheet({
  isOpen,
  onClose,
  isLoggedIn,
  customerName,
}: {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  customerName: string | null;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-up sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-[#161a1f] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        {/* Handle bar */}
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            More
          </p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid of quick links */}
        <div className="grid grid-cols-4 gap-1 px-3 pb-3">
          {[
            { label: "Plus", href: "/subscription", icon: Star, gold: true },
            { label: "Articles", href: "/blog", icon: Newspaper, gold: false },
            { label: "Guides", href: "/how-it-works", icon: BookMarked, gold: false },
            { label: "Settings", href: "/settings", icon: Settings, gold: false },
          ].map(({ label, href, icon: Icon, gold }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition hover:bg-white/5"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  gold ? "bg-[#d4af37]/15" : "bg-white/5"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${gold ? "text-[#d4af37]" : "text-gray-300"}`}
                  strokeWidth={1.75}
                />
              </span>
              <span
                className={`text-[11px] font-semibold ${gold ? "text-[#d4af37]" : "text-gray-400"}`}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* AI Haircut feature highlight */}
        <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/10 to-transparent">
          <Link href="/styles/ai" onClick={onClose} className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/20">
              <Scissors className="h-5 w-5 text-[#d4af37]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">AI Haircut Styler</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Upload your photo &amp; try different hairstyles
              </p>
            </div>
            <Sparkles className="ml-auto h-4 w-4 shrink-0 text-[#d4af37]" />
          </Link>
        </div>

        {/* Auth section */}
        <div className="border-t border-white/5 px-3 pt-3">
          {isLoggedIn ? (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl bg-[#d4af37] py-3 text-sm font-bold text-black transition hover:brightness-110"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function BottomNav({ isLoggedIn, customerName }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <MoreSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        isLoggedIn={isLoggedIn}
        customerName={customerName}
      />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0d1013]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex h-14 items-end justify-around px-1 pt-2">
          {TABS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition-colors active:scale-95 ${
                  isActive ? "text-[#d4af37]" : "text-gray-500 hover:text-gray-300"
                }`}
                style={{ touchAction: "manipulation" }}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-lg transition-colors ${
                    isActive ? "bg-[#d4af37]/15" : ""
                  }`}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </span>
                <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition-colors active:scale-95 ${
              moreOpen ? "text-[#d4af37]" : "text-gray-500 hover:text-gray-300"
            }`}
            style={{ touchAction: "manipulation" }}
            aria-label="More options"
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-lg transition-colors ${
                moreOpen ? "bg-[#d4af37]/15" : ""
              }`}
            >
              <MoreHorizontal
                className="h-5 w-5 shrink-0"
                strokeWidth={moreOpen ? 2.25 : 1.75}
              />
            </span>
            <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-wide">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
