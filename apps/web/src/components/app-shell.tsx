"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Contact2,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Package,
  Plus,
  Scissors,
  Settings,
  Store,
  Users,
  Wallet,
  X
} from "lucide-react";
import { type ReactNode, useState } from "react";

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",    icon: Home },
  { label: "Queue",        href: "/queue",        icon: ClipboardList },
  { label: "Appointments", href: "/appointments", icon: CalendarCheck2 },
  { label: "POS",          href: "/pos",          icon: CreditCard },
  { label: "Customers",    href: "/customers",    icon: Contact2 },
  { label: "Staff",        href: "/staff",        icon: Users }
];

const NAV_MANAGEMENT: NavItem[] = [
  { label: "Payroll & Comm.", href: "/payroll",     icon: CircleDollarSign },
  { label: "Inventory",       href: "/inventory",   icon: Package },
  { label: "Expenses",        href: "/expenses",    icon: Wallet },
  { label: "Reports",         href: "/reports",     icon: BarChart3 },
  { label: "Branches",        href: "/branches",    icon: Store }
];

const NAV_BUSINESS: NavItem[] = [
  { label: "Commissions", href: "/commissions", icon: Scissors },
  { label: "Settings",    href: "/settings",    icon: Settings }
];

// ─── Sidebar link ─────────────────────────────────────────────────────────────

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "border-l-[3px] border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37]"
          : "border-l-[3px] border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavGroup({ label, items, pathname, onNav }: { label: string; items: NavItem[]; pathname: string; onNav?: () => void }) {
  return (
    <div className="mt-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} onClick={onNav} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/20">
          <Scissors className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">
            BarberPro<span className="text-[#D4AF37]">.my</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Owner Dashboard
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Main</p>
          {NAV_MAIN.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} onClick={onNav} />
          ))}
        </div>
        <NavGroup label="Management" items={NAV_MANAGEMENT} pathname={pathname} onNav={onNav} />
        <NavGroup label="Business"   items={NAV_BUSINESS}   pathname={pathname} onNav={onNav} />
      </nav>

      {/* User profile */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37]/40 bg-[#D4AF37]/20 text-sm font-bold text-[#D4AF37]">
            AR
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Ahmad Razak</p>
            <p className="truncate text-xs text-gray-500">Owner • KL Branch</p>
          </div>
          <button type="button" className="shrink-0 text-gray-400 transition hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type AppShellProps = { children: ReactNode };

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#1a1a1a] lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close sidebar"
          />
          <aside className="relative h-full w-64 border-r border-white/5 bg-[#1a1a1a]">
            <button
              className="absolute right-3 top-4 rounded-md p-1.5 text-gray-400 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#1a1a1a]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 text-gray-400 hover:text-white lg:hidden"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Branch selector */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40"
            >
              <span className="font-medium">KL Sentral HQ</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button type="button" className="relative rounded-md p-2 text-gray-400 transition hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[8px] text-white" />
            </button>
            {/* New Walk-in CTA */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Walk-in</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#111111] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
