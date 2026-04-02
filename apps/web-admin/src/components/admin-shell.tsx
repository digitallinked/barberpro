"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Shield, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import { AppLogo } from "@/components/app-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ADMIN_NAV_GROUPS } from "@/constants/navigation";
import { ROLE_COLORS, ROLE_LABELS, type AdminRole } from "@/constants/permissions";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  role: AdminRole;
  email?: string;
  name?: string;
};

function useSignOut() {
  const router = useRouter();

  return async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
  };
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "A";
}

export function AdminShell({ children, role, email, name }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const signOut = useSignOut();

  const visibleGroups = ADMIN_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col gap-6">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary/15 text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-sidebar-accent focus:outline-none">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">{getInitials(name, email)}</AvatarFallback>
        </Avatar>
        <div className="text-left hidden lg:block">
          <p className="text-xs font-medium text-sidebar-foreground leading-none">{name ?? email ?? "Admin"}</p>
          <p className={cn("mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold", ROLE_COLORS[role])}>
            {ROLE_LABELS[role]}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name ?? "Admin"}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>{ROLE_LABELS[role]}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <AppLogo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavContent />
        </nav>
        <div className="border-t border-sidebar-border px-3 py-3">
          <UserMenu />
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur-sm md:px-6">
          {/* Mobile menu toggle */}
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <span className="text-sm font-semibold text-foreground/80 tracking-tight">BarberPro Admin Console</span>
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 lg:hidden">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{getInitials(name, email)}</AvatarFallback>
            </Avatar>
          </div>

          {/* Desktop right side */}
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
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
          <aside className="relative flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <AppLogo />
              <button
                className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent"
                onClick={() => setOpen(false)}
                type="button"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavContent onNavigate={() => setOpen(false)} />
            </nav>
            <div className="border-t border-sidebar-border px-3 py-3">
              <UserMenu />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
