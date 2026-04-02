"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { AppLogo } from "@/components/app-logo";
import { ADMIN_NAV_ITEMS } from "@/constants/navigation";
import { ROLE_LABELS, type AdminRole } from "@/constants/permissions";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  role: AdminRole;
};

export function AdminShell({ children, role }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/70 bg-card lg:flex lg:flex-col">
        <div className="p-4">
          <AppLogo />
          <nav className="mt-6 space-y-1">
            <NavLinks />
          </nav>
        </div>
        {/* Role badge pinned to the bottom of the sidebar */}
        <div className="mt-auto border-t border-border/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-6">
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm text-muted-foreground">BarberPro Admin Console</p>
          <span className="rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            {ROLE_LABELS[role]}
          </span>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close sidebar overlay"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-border/70 bg-card p-4">
            <div className="flex items-center justify-between">
              <AppLogo />
              <button
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
                type="button"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 space-y-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            <div className="mt-auto border-t border-border/70 pt-3">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
