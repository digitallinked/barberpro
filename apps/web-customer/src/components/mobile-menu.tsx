"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Scissors, User, LogOut, Star, Search } from "lucide-react";

type Props = {
  isLoggedIn: boolean;
  customerName: string | null;
};

export function MobileMenu({ isLoggedIn, customerName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-x-0 top-0 z-50 rounded-b-2xl border-b border-border bg-card p-6 shadow-2xl sm:hidden">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Scissors className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  BarberPro<span className="text-primary">.my</span>
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <Link
                href="/shops"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                Find Shops
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Scissors className="h-4 w-4 text-muted-foreground" />
                How It Works
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/subscription"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Star className="h-4 w-4 text-primary" />
                    BarberPro Plus
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    {customerName?.split(" ")[0] ?? "Profile"}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Log In
                  </Link>
                </>
              )}
            </nav>

            {/* Bottom actions */}
            {isLoggedIn ? (
              <div className="mt-6 border-t border-border pt-4">
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-6 border-t border-border pt-4">
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
