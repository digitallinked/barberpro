"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
  LogOut,
  Megaphone,
  Menu,
  Package,
  Plus,
  Scissors,
  Settings,
  Store,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { QuickPaymentSheet } from "@/components/quick-payment-sheet";
import { useTenant } from "@/components/tenant-provider";
import {
  WalkInQueueModalProvider,
  useWalkInQueueModal,
} from "@/components/walk-in-queue-modal-context";
import { signOut } from "@/actions/auth";

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Queue", href: "/queue", icon: ClipboardList },
  { label: "POS", href: "/pos", icon: CreditCard },
  { label: "Appointments", href: "/appointments", icon: CalendarCheck2 },
  { label: "Services", href: "/services", icon: Scissors },
  { label: "Customers", href: "/customers", icon: Contact2 },
  { label: "Staff", href: "/staff", icon: Users },
];

const NAV_MANAGEMENT: NavItem[] = [
  { label: "Payroll & Comm.", href: "/payroll", icon: CircleDollarSign },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Expenses", href: "/expenses", icon: Wallet },
  { label: "Promotions", href: "/promotions", icon: Megaphone },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Branches", href: "/branches", icon: Store },
];

const NAV_BUSINESS: NavItem[] = [
  { label: "Commissions", href: "/commissions", icon: Scissors },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Mobile tab bar: center FAB opens quick payment; Services stays in More / POS */
const NAV_MOBILE_LEFT: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Queue", href: "/queue", icon: ClipboardList },
];
const NAV_MOBILE_RIGHT: NavItem[] = [
  { label: "Appts", href: "/appointments", icon: CalendarCheck2 },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
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
    <div className="mt-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
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
            {roleLabel} Dashboard
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Main
          </p>
          {NAV_MAIN.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              onClick={onNav}
            />
          ))}
        </div>
        <NavGroup
          label="Management"
          items={NAV_MANAGEMENT}
          pathname={pathname}
          onNav={onNav}
        />
        <NavGroup
          label="Business"
          items={NAV_BUSINESS}
          pathname={pathname}
          onNav={onNav}
        />
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37]/40 bg-[#D4AF37]/20 text-sm font-bold text-[#D4AF37]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-gray-500">
              {roleLabel} &bull; {branchName}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="shrink-0 text-gray-400 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
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
        {item.label}
      </span>
    </Link>
  );
}

function MobileBottomNav({
  pathname,
  onOpenMenu,
  menuOpen,
  onReceivePayment,
}: {
  pathname: string;
  onOpenMenu: () => void;
  menuOpen: boolean;
  onReceivePayment: () => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
      <div className="relative w-full border-t border-white/10 bg-[#1a1a1a]/92 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[45%]">
          <button
            type="button"
            onClick={onReceivePayment}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-[#111111] shadow-[0_6px_28px_rgba(212,175,55,0.42)] ring-[5px] ring-[#1a1a1a] transition active:scale-95"
            aria-label="Receive payment from client"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex h-[60px] items-end justify-between gap-0 px-1.5 pt-2 box-border">
          <div className="flex min-w-0 flex-1 justify-around gap-0.5">
            {NAV_MOBILE_LEFT.map((item) => (
              <MobileTabLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
          <div className="w-16 shrink-0 sm:w-[4.5rem]" aria-hidden />
          <div className="flex min-w-0 flex-1 justify-around gap-0.5">
            {NAV_MOBILE_RIGHT.map((item) => (
              <MobileTabLink key={item.href} item={item} active={pathname === item.href} />
            ))}
            <button
              type="button"
              onClick={onOpenMenu}
              aria-expanded={menuOpen}
              aria-label="Open full menu"
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
                More
              </span>
            </button>
          </div>
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
  const [open, setOpen] = useState(false);
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { requestOpenNewWalkIn } = useWalkInQueueModal();

  let userName = "User";
  let userRole = "owner";
  let branchName = "Main Branch";
  let branches: { id: string; name: string; is_hq: boolean }[] = [];

  try {
    const tenant = useTenant();
    userName = tenant.userName;
    userRole = tenant.userRole;
    branchName = tenant.branchName ?? "No Branch";
    branches = tenant.branches;
  } catch {
    // TenantProvider not available (e.g. dev mode without Supabase)
  }

  const onNewWalkIn = () => {
    requestOpenNewWalkIn();
    if (pathname !== "/queue") {
      router.push("/queue");
    }
  };

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
              onClick={() => setQuickPayOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 lg:inline-flex"
            >
              <Banknote className="h-4 w-4" />
              Receive payment
            </button>
            <button
              type="button"
              className="relative rounded-md p-2 text-gray-400 transition hover:text-white"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNewWalkIn}
              className="hidden items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 lg:inline-flex"
            >
              <Plus className="h-4 w-4 shrink-0" />
              New Walk-in
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#111111] px-4 py-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-6">
          {children}
        </main>

        <MobileBottomNav
          pathname={pathname}
          menuOpen={open}
          onOpenMenu={() => setOpen(true)}
          onReceivePayment={() => setQuickPayOpen(true)}
        />

        <QuickPaymentSheet open={quickPayOpen} onOpenChange={setQuickPayOpen} />
      </div>
    </div>
  );
}
