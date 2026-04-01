"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookMarked,
  CalendarClock,
  ChevronDown,
  LogIn,
  LogOut,
  Settings,
  Star,
  User,
} from "lucide-react";

import { useT } from "@/lib/i18n/language-context";

type Props = {
  isLoggedIn: boolean;
  customerName: string | null;
  avatarUrl: string | null;
};

function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const initial = name?.charAt(0).toUpperCase() ?? null;

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? "Profile"}
        width={size === "sm" ? 32 : 36}
        height={size === "sm" ? 32 : 36}
        className={`${dim} rounded-full border border-[#d4af37]/30 object-cover`}
      />
    );
  }

  return (
    <span
      className={`${dim} flex items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 font-bold text-[#d4af37]`}
    >
      {initial ?? <User className="h-4 w-4" />}
    </span>
  );
}

export function ProfileMenu({ isLoggedIn, customerName, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open profile menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5"
        >
          <Avatar name={customerName} avatarUrl={avatarUrl} />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-200 sm:block">
            {customerName?.split(" ")[0] ?? "Profile"}
          </span>
          <ChevronDown
            className={`hidden h-3.5 w-3.5 text-gray-400 transition-transform sm:block ${open ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open profile menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          <User className="h-4 w-4" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#161a1f] shadow-2xl shadow-black/40">
          {isLoggedIn ? (
            <>
              {/* User info header */}
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5">
                <Avatar name={customerName} avatarUrl={avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {customerName ?? "Customer"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{t.auth.member}</p>
                </div>
              </div>

              {/* Nav items */}
              <div className="py-1.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <User className="h-4 w-4 shrink-0 text-gray-500" />
                  {t.auth.myProfile}
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <CalendarClock className="h-4 w-4 shrink-0 text-gray-500" />
                  {t.auth.myBookings}
                </Link>
                <Link
                  href="/subscription"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-[#d4af37]"
                >
                  <Star className="h-4 w-4 shrink-0 text-[#d4af37]" />
                  {t.auth.barberProPlus}
                </Link>
                <Link
                  href="/how-it-works"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <BookMarked className="h-4 w-4 shrink-0 text-gray-500" />
                  {t.auth.howItWorks}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings className="h-4 w-4 shrink-0 text-gray-500" />
                  {t.auth.settings}
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-white/5 py-1.5">
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t.auth.signOut}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-white/5 px-4 py-3.5">
                <p className="text-sm font-semibold text-white">{t.auth.welcomeGuest}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t.auth.welcomeGuestDesc}
                </p>
              </div>
              <div className="p-3 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  {t.auth.logIn}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-[#d4af37] py-2.5 text-sm font-bold text-black transition hover:brightness-110"
                >
                  {t.auth.signUpFreeBtn}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
