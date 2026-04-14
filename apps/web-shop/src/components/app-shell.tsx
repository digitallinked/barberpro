"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  ClipboardList,
  Contact2,
  CreditCard,
  Home,
  Megaphone,
  Menu,
  Package,
  Scale,
  Scissors,
  Settings,
  Store,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { RouteGuard } from "@/components/route-guard";
import { useTenant } from "@/components/tenant-provider";
import {
  WalkInQueueModalProvider,
} from "@/components/walk-in-queue-modal-context";
import { shopMediaObjectPublicUrl } from "@barberpro/db/shop-media";
import { useT } from "@/lib/i18n/language-context";
import { canAccessPage } from "@/lib/permissions";

/** Nav items marked `global: true` are not branch-scoped (e.g. /billing, /branches). */
type NavItem = {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  pageKey: string;
  global?: boolean;
};

function useNavItems(role: string) {
  const t = useT();

  const allOps: NavItem[] = [
    { labelKey: t.nav.dashboard, href: "/dashboard", icon: Home, pageKey: "dashboard" },
    { labelKey: t.nav.queue, href: "/queue", icon: ClipboardList, pageKey: "queue" },
    { labelKey: t.nav.appointments, href: "/appointments", icon: CalendarCheck2, pageKey: "appointments" },
    { labelKey: t.nav.pos, href: "/pos", icon: CreditCard, pageKey: "pos" },
  ];

  const allCustomers: NavItem[] = [
    { labelKey: t.nav.customers, href: "/customers", icon: Contact2, pageKey: "customers" },
    { labelKey: t.nav.services, href: "/services", icon: Scissors, pageKey: "services" },
  ];

  const allTeam: NavItem[] = [
    { labelKey: t.nav.staff, href: "/staff", icon: Users, pageKey: "staff" },
    { labelKey: t.nav.payroll, href: "/payroll", icon: CircleDollarSign, pageKey: "payroll" },
    { labelKey: t.nav.commissions, href: "/commissions", icon: TrendingUp, pageKey: "commissions" },
  ];

  const allBusiness: NavItem[] = [
    { labelKey: t.nav.inventory, href: "/inventory", icon: Package, pageKey: "inventory" },
    { labelKey: t.nav.expenses, href: "/expenses", icon: Wallet, pageKey: "expenses" },
    { labelKey: t.nav.promotions, href: "/promotions", icon: Megaphone, pageKey: "promotions" },
    { labelKey: t.nav.reports, href: "/reports", icon: BarChart3, pageKey: "reports" },
    // Branch settings: NOT global — gets the active branch prefix automatically
    { labelKey: t.nav.settings, href: "/settings", icon: Settings, pageKey: "branch_settings" },
  ];

  const allWorkspace: NavItem[] = [
    // Owner-only workspace items
    { labelKey: t.nav.branches, href: "/branches", icon: Store, pageKey: "branches_directory", global: true },
    { labelKey: t.nav.businessProfile, href: "/workspace/profile", icon: Building2, pageKey: "workspace_profile", global: true },
    { labelKey: t.nav.taxCompliance, href: "/workspace/tax", icon: Scale, pageKey: "tax", global: true },
    { labelKey: t.nav.billing, href: "/billing", icon: Banknote, pageKey: "billing", global: true },
  ];

  const filter = (items: NavItem[]) => items.filter((i) => canAccessPage(role, i.pageKey));

  const NAV_OPERATIONS = filter(allOps);
  const NAV_CUSTOMERS = filter(allCustomers);
  const NAV_TEAM = filter(allTeam);
  const NAV_BUSINESS = filter(allBusiness);
  const NAV_WORKSPACE = filter(allWorkspace);

  const NAV_MOBILE: NavItem[] = [
    { labelKey: t.nav.home, href: "/dashboard", icon: Home, pageKey: "dashboard" },
    { labelKey: t.nav.queue, href: "/queue", icon: ClipboardList, pageKey: "queue" },
    { labelKey: t.nav.pos, href: "/pos", icon: CreditCard, pageKey: "pos" },
    { labelKey: t.nav.appts, href: "/appointments", icon: CalendarCheck2, pageKey: "appointments" },
  ].filter((i) => canAccessPage(role, i.pageKey));

  return { NAV_OPERATIONS, NAV_CUSTOMERS, NAV_TEAM, NAV_BUSINESS, NAV_WORKSPACE, NAV_MOBILE };
}

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return href !== "/" && pathname.startsWith(href + "/");
}

function NavLink({
  item,
  pathname,
  onClick,
  collapsed,
  branchPrefix,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
  collapsed?: boolean;
  branchPrefix: string;
}) {
  const Icon = item.icon;
  const fullHref = item.global ? item.href : `${branchPrefix}${item.href}`;
  const active = isNavActive(pathname, fullHref);
  return (
    <Link
      href={fullHref}
      onClick={onClick}
      title={collapsed ? item.labelKey : undefined}
      className={`flex items-center rounded-md text-sm font-medium transition-all ${
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
      } ${
        active
          ? `bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] ${collapsed ? "" : "border-l-[3px] border-[#D4AF37]"}`
          : `text-gray-400 hover:bg-white/[0.03] hover:text-white ${collapsed ? "" : "border-l-[3px] border-transparent"}`
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${collapsed && active ? "text-[#D4AF37]" : ""}`} />
      {!collapsed && item.labelKey}
    </Link>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNav,
  collapsed,
  branchPrefix,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNav?: () => void;
  collapsed?: boolean;
  branchPrefix: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 first:mt-0">
      {collapsed ? (
        <div className="mb-2 mx-2 border-t border-white/5" />
      ) : (
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onClick={onNav}
            collapsed={collapsed}
            branchPrefix={branchPrefix}
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
  userAvatarUrl,
  branchName,
  collapsed,
  onToggleCollapse,
  branchPrefix,
}: {
  pathname: string;
  onNav?: () => void;
  userName: string;
  userRole: string;
  userAvatarUrl: string;
  branchName: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  branchPrefix: string;
}) {
  const t = useT();
  const { NAV_OPERATIONS, NAV_CUSTOMERS, NAV_TEAM, NAV_BUSINESS, NAV_WORKSPACE } = useNavItems(userRole);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const avatarSrc = userAvatarUrl ? shopMediaObjectPublicUrl(userAvatarUrl) : null;

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center border-b border-white/5 px-4 py-5 ${collapsed ? "justify-center" : "gap-2.5"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
          <Scissors className="h-4 w-4 text-[#D4AF37]" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none text-white">
              BarberPro<span className="text-[#D4AF37]">.my</span>
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {roleLabel} {t.common.dashboard}
            </p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
          <p className="truncate text-[11px] font-medium text-gray-400">
            {branchName}
          </p>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-1" : "px-3"}`}>
        <NavGroup
          label={t.nav.operations}
          items={NAV_OPERATIONS}
          pathname={pathname}
          onNav={onNav}
          collapsed={collapsed}
          branchPrefix={branchPrefix}
        />
        <NavGroup
          label={t.nav.customers}
          items={NAV_CUSTOMERS}
          pathname={pathname}
          onNav={onNav}
          collapsed={collapsed}
          branchPrefix={branchPrefix}
        />
        <NavGroup
          label={t.nav.team}
          items={NAV_TEAM}
          pathname={pathname}
          onNav={onNav}
          collapsed={collapsed}
          branchPrefix={branchPrefix}
        />
        <NavGroup
          label={t.nav.business}
          items={NAV_BUSINESS}
          pathname={pathname}
          onNav={onNav}
          collapsed={collapsed}
          branchPrefix={branchPrefix}
        />
        <NavGroup
          label={t.nav.workspace}
          items={NAV_WORKSPACE}
          pathname={pathname}
          onNav={onNav}
          collapsed={collapsed}
          branchPrefix={branchPrefix}
        />
      </nav>

      {onToggleCollapse && (
        <div className="border-t border-white/5 px-3 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center rounded-md px-2 py-2 text-xs text-gray-500 transition hover:bg-white/[0.04] hover:text-gray-300 ${collapsed ? "justify-center" : "gap-2"}`}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="border-t border-white/5 p-3">
        <Link
          href="/profile"
          onClick={onNav}
          title={collapsed ? `${userName} • ${roleLabel} • ${branchName}` : undefined}
          className={`flex items-center rounded-lg px-2 py-2 transition hover:bg-white/[0.04] ${
            pathname === "/profile" ? "bg-[#D4AF37]/10" : ""
          } ${collapsed ? "justify-center" : "gap-3"}`}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={userName}
              className={`h-10 w-10 shrink-0 rounded-full border-2 object-cover transition ${
                pathname === "/profile" ? "border-[#D4AF37]" : "border-[#D4AF37]/40"
              }`}
            />
          ) : (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
              pathname === "/profile"
                ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                : "border-[#D4AF37]/40 bg-[#D4AF37]/20 text-[#D4AF37]"
            }`}>
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-xs text-gray-500">
                {roleLabel} &bull; {branchName}
              </p>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

function MobileTabLink({
  item,
  active,
  branchPrefix,
}: {
  item: NavItem;
  active: boolean;
  branchPrefix: string;
}) {
  const Icon = item.icon;
  const fullHref = item.global ? item.href : `${branchPrefix}${item.href}`;
  return (
    <Link
      href={fullHref}
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
  userRole,
  branchPrefix,
}: {
  pathname: string;
  onOpenMenu: () => void;
  menuOpen: boolean;
  userRole: string;
  branchPrefix: string;
}) {
  const t = useT();
  const { NAV_MOBILE } = useNavItems(userRole);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" aria-label="Primary">
      <div className="w-full border-t border-white/10 bg-[#1a1a1a]/92 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-[60px] items-end justify-around gap-0 px-1.5 pt-2">
          {NAV_MOBILE.map((item) => {
            const fullHref = item.global ? item.href : `${branchPrefix}${item.href}`;
            return (
              <MobileTabLink
                key={item.href}
                item={item}
                active={isNavActive(pathname, fullHref)}
                branchPrefix={branchPrefix}
              />
            );
          })}
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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  let userName = "User";
  let userRole = "owner";
  let userAvatarUrl = "";
  let branches: { id: string; name: string; slug: string; is_hq: boolean }[] = [];
  let subscriptionStatus: string | null = null;

  try {
    const tenant = useTenant();
    userName = tenant.userName;
    userRole = tenant.userRole;
    userAvatarUrl = tenant.userAvatarUrl;
    branches = tenant.branches;
    subscriptionStatus = tenant.subscriptionStatus ?? null;
  } catch {
    // TenantProvider not available (e.g. dev mode without Supabase)
  }

  // Derive active branch from the URL path — first segment is the branch slug
  const pathSegments = pathname.split("/").filter(Boolean);
  const slugSegment = pathSegments[0] ?? "";
  const isAllBranches = slugSegment === "all";
  const activeBranch = branches.find((b) => b.slug === slugSegment) ?? null;

  // When on a global page (billing, settings, etc.), default to HQ branch for nav links
  const defaultBranch = branches.find((b) => b.is_hq) ?? branches[0] ?? null;
  const branchForNav = activeBranch ?? (isAllBranches ? null : defaultBranch);
  const branchPrefix = branchForNav?.slug ? `/${branchForNav.slug}` : isAllBranches ? "/all" : "";

  const displayBranchName = isAllBranches
    ? t.branches.allBranches
    : (activeBranch?.name ?? branches[0]?.name ?? "No Branch");

  // The page name within the branch (second path segment onwards)
  const isBranchScopedPath = activeBranch !== null || isAllBranches;
  const currentSubPath = isBranchScopedPath
    ? (pathSegments.slice(1).join("/") || "dashboard")
    : "dashboard";

  const handleBranchSwitch = (slug: string | null) => {
    const targetSlug = slug === null ? "all" : slug;
    router.push(`/${targetSlug}/${currentSubPath}`);
    setBranchDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPaymentPastDue = subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      <aside
        className={`hidden shrink-0 border-r border-white/5 bg-[#1a1a1a] transition-all duration-200 lg:block ${
          collapsed ? "w-[60px]" : "w-64"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          userName={userName}
          userRole={userRole}
          userAvatarUrl={userAvatarUrl}
          branchName={displayBranchName}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          branchPrefix={branchPrefix}
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
              userAvatarUrl={userAvatarUrl}
              branchName={displayBranchName}
              branchPrefix={branchPrefix}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#1a1a1a]/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {userRole === "owner" ? (
              <div className="relative" ref={branchDropdownRef}>
                <button
                  type="button"
                  onClick={() => branches.length > 0 && setBranchDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40"
                >
                  <Store className="h-4 w-4 text-[#D4AF37]" />
                  <span className="max-w-[180px] truncate font-medium">{displayBranchName}</span>
                  {branches.length > 0 && (
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${branchDropdownOpen ? "rotate-180" : ""}`} />
                  )}
                </button>
                {branchDropdownOpen && branches.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/40">
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => handleBranchSwitch(null)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${isAllBranches ? "bg-[#D4AF37]/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                      >
                        <Store className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-left">{t.branches.allBranches}</span>
                        {isAllBranches && <Check className="h-3.5 w-3.5 text-[#D4AF37]" />}
                      </button>
                      <div className="my-1 border-t border-white/5" />
                      {branches.map((b) => {
                        const isActive = b.slug === slugSegment;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleBranchSwitch(b.slug)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-[#D4AF37]/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                          >
                            <Store className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate text-left">{b.name}</span>
                            {b.is_hq && <span className="rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">HQ</span>}
                            {isActive && <Check className="h-3.5 w-3.5 text-[#D4AF37]" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-white/5 p-1.5">
                      <Link href="/branches" onClick={() => setBranchDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-white/5 hover:text-white">
                        {t.branches.manageBranches}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white">
                <Store className="h-4 w-4 text-[#D4AF37]" />
                <span className="max-w-[180px] truncate font-medium">{displayBranchName}</span>
              </div>
            )}
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
              href="/billing"
              className="shrink-0 rounded-md bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
            >
              Update billing
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#111111] px-4 py-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-6">
          <RouteGuard>{children}</RouteGuard>
        </main>

        <MobileBottomNav
          pathname={pathname}
          menuOpen={open}
          onOpenMenu={() => setOpen(true)}
          userRole={userRole}
          branchPrefix={branchPrefix}
        />

      </div>

      <PwaInstallBanner />
    </div>
  );
}
