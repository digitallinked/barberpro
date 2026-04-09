"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Contact2,
  CreditCard,
  Home,
  Megaphone,
  Menu,
  Package,
  Scissors,
  Settings,
  Store,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { useTenant } from "@/components/tenant-provider";
import {
  WalkInQueueModalProvider,
} from "@/components/walk-in-queue-modal-context";
import { useT } from "@/lib/i18n/language-context";

type NavItem = { labelKey: string; href: string; icon: React.ElementType };

function useNavItems() {
  const t = useT();

  const NAV_OPERATIONS: NavItem[] = [
    { labelKey: t.nav.dashboard, href: "/dashboard", icon: Home },
    { labelKey: t.nav.queue, href: "/queue", icon: ClipboardList },
    { labelKey: t.nav.appointments, href: "/appointments", icon: CalendarCheck2 },
    { labelKey: t.nav.pos, href: "/pos", icon: CreditCard },
  ];

  const NAV_CUSTOMERS: NavItem[] = [
    { labelKey: t.nav.customers, href: "/customers", icon: Contact2 },
    { labelKey: t.nav.services, href: "/services", icon: Scissors },
  ];

  const NAV_TEAM: NavItem[] = [
    { labelKey: t.nav.staff, href: "/staff", icon: Users },
    { labelKey: t.nav.payroll, href: "/payroll", icon: CircleDollarSign },
    { labelKey: t.nav.commissions, href: "/commissions", icon: TrendingUp },
  ];

  const NAV_BUSINESS: NavItem[] = [
    { labelKey: t.nav.inventory, href: "/inventory", icon: Package },
    { labelKey: t.nav.expenses, href: "/expenses", icon: Wallet },
    { labelKey: t.nav.promotions, href: "/promotions", icon: Megaphone },
    { labelKey: t.nav.reports, href: "/reports", icon: BarChart3 },
    { labelKey: t.nav.branches, href: "/branches", icon: Store },
    { labelKey: t.nav.settings, href: "/settings", icon: Settings },
  ];

  const NAV_WORKSPACE: NavItem[] = [
    { labelKey: t.nav.billing, href: "/settings/billing", icon: Banknote },
  ];

  const NAV_MOBILE: NavItem[] = [
    { labelKey: t.nav.home, href: "/dashboard", icon: Home },
    { labelKey: t.nav.queue, href: "/queue", icon: ClipboardList },
    { labelKey: t.nav.pos, href: "/pos", icon: CreditCard },
    { labelKey: t.nav.appts, href: "/appointments", icon: CalendarCheck2 },
  ];

  return { NAV_OPERATIONS, NAV_CUSTOMERS, NAV_TEAM, NAV_BUSINESS, NAV_WORKSPACE, NAV_MOBILE };
}

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Match child routes (e.g. /staff/123 → Staff is active), but guard
  // against /settings/billing incorrectly activating /settings.
  return href !== "/" && pathname.startsWith(href + "/");
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const active = isNavActive(pathname, item.href);
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
      {item.labelKey}
    </Link>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNav,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNav?: () => void;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNav}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNav,
  userName,
  userRole,
  branchName,
}: {
  pathname: string;
  onNav?: () => void;
  userName: string;
  userRole: string;
  branchName: string;
}) {
  const t = useT();
  const { NAV_OPERATIONS, NAV_CUSTOMERS, NAV_TEAM, NAV_BUSINESS, NAV_WORKSPACE } = useNavItems();

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/20">
          <Scissors className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">
            BarberPro<span className="text-[#D4AF37]">.my</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {roleLabel} {t.common.dashboard}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup
          label={t.nav.operations}
          items={NAV_OPERATIONS}
          pathname={pathname}
          onNav={onNav}
        />
        <NavGroup
          label={t.nav.customers}
          items={NAV_CUSTOMERS}
          pathname={pathname}
          onNav={onNav}
        />
        <NavGroup
          label={t.nav.team}
          items={NAV_TEAM}
          pathname={pathname}
          onNav={onNav}
        />
        <NavGroup
          label={t.nav.business}
          items={NAV_BUSINESS}
          pathname={pathname}
          onNav={onNav}
        />
        <NavGroup
          label={t.nav.workspace}
          items={NAV_WORKSPACE}
          pathname={pathname}
          onNav={onNav}
        />
      </nav>

      <div className="border-t border-white/5 p-3">
        <Link
          href="/profile"
          onClick={onNav}
          className={`flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04] ${
            pathname === "/profile" ? "bg-[#D4AF37]/10" : ""
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
            pathname === "/profile"
              ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
              : "border-[#D4AF37]/40 bg-[#D4AF37]/20 text-[#D4AF37]"
          }`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-gray-500">
              {roleLabel} &bull; {branchName}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function MobileTabLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-0 transition-colors active:scale-[0.97] active:opacity-90 ${
        active ? "text-[#D4AF37]" : "text-gray-500 hover:text-gray-300"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      <span
        className={`flex h-8 w-11 items-center justify-center rounded-lg transition-colors ${
          active ? "bg-[#D4AF37]/15" : ""
        }`}
      >
        <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      </span>
      <span className="max-w-full truncate px-0.5 text-[10px] font-semibold leading-none tracking-wide">
        {item.labelKey}
      </span>
    </Link>
  );
}

function MobileBottomNav({
  pathname,
  onOpenMenu,
  menuOpen,
}: {
  pathname: string;
  onOpenMenu: () => void;
  menuOpen: boolean;
}) {
  const t = useT();
  const { NAV_MOBILE } = useNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
      <div className="w-full border-t border-white/10 bg-[#1a1a1a]/92 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-[60px] items-end justify-around gap-0 px-1.5 pt-2">
          {NAV_MOBILE.map((item) => (
            <MobileTabLink
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
            />
          ))}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-expanded={menuOpen}
            aria-label={t.nav.more}
            className={`flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-0 transition-colors active:scale-[0.97] active:opacity-90 ${
              menuOpen ? "text-[#D4AF37]" : "text-gray-500 hover:text-gray-300"
            }`}
            style={{ touchAction: "manipulation" }}
          >
            <span
              className={`flex h-8 w-11 items-center justify-center rounded-lg transition-colors ${
                menuOpen ? "bg-[#D4AF37]/15" : ""
              }`}
            >
              <Menu className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={menuOpen ? 2.25 : 1.75} />
            </span>
            <span className="max-w-full truncate px-0.5 text-[10px] font-semibold leading-none tracking-wide">
              {t.nav.more}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

type AppShellProps = { children: ReactNode };

export function AppShell({ children }: AppShellProps) {
  return (
    <WalkInQueueModalProvider>
      <AppShellInner>{children}</AppShellInner>
    </WalkInQueueModalProvider>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  let userName = "User";
  let userRole = "owner";
  let branchName = "Main Branch";
  let branches: { id: string; name: string; is_hq: boolean }[] = [];
  let subscriptionStatus: string | null = null;

  try {
    const tenant = useTenant();
    userName = tenant.userName;
    userRole = tenant.userRole;
    branchName = tenant.branchName ?? "No Branch";
    branches = tenant.branches;
    subscriptionStatus = tenant.subscriptionStatus ?? null;
  } catch {
    // TenantProvider not available (e.g. dev mode without Supabase)
  }

  const isPaymentPastDue = subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#1a1a1a] lg:block">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          userRole={userRole}
          branchName={branchName}
        />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            type="button"
            aria-label={t.common.close}
          />
          <aside className="relative h-full w-64 border-r border-white/5 bg-[#1a1a1a]">
            <button
              className="absolute right-3 top-4 rounded-md p-1.5 text-gray-400 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
              aria-label={t.common.close}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              onNav={() => setOpen(false)}
              userName={userName}
              userRole={userRole}
              branchName={branchName}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#1a1a1a]/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40"
            >
              <span className="font-medium">{branchName}</span>
              {branches.length > 1 && (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="relative rounded-md p-2 text-gray-400 transition hover:text-white"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {isPaymentPastDue && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-300">
                <span className="font-semibold">Payment failed.</span>{" "}
                Please update your payment method to avoid service interruption.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="shrink-0 rounded-md bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
            >
              Update billing
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#111111] px-4 py-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-6">
          {children}
        </main>

        <MobileBottomNav
          pathname={pathname}
          menuOpen={open}
          onOpenMenu={() => setOpen(true)}
        />

      </div>

      <PwaInstallBanner />
    </div>
  );
}
