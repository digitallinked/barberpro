export type UserRole = "owner" | "manager" | "barber" | "cashier";

export type BranchScope = "all" | "own";

type RolePermission = {
  allowedPages: string[];
  canManageBranches: boolean;
  canManageBilling: boolean;
  canInviteStaff: boolean;
  canManageSettings: boolean;
  branchScope: BranchScope;
};

const ALL_PAGES = [
  "dashboard",
  "queue",
  "appointments",
  "pos",
  "customers",
  "services",
  "staff",
  "payroll",
  "commissions",
  "inventory",
  "expenses",
  "promotions",
  "reports",
  "branches",
  "settings",
  "billing",
  "profile",
];

const OPS_PAGES = ["dashboard", "queue", "appointments", "pos"];

const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  owner: {
    allowedPages: ALL_PAGES,
    canManageBranches: true,
    canManageBilling: true,
    canInviteStaff: true,
    canManageSettings: true,
    branchScope: "all",
  },
  manager: {
    allowedPages: [
      ...OPS_PAGES,
      "customers",
      "services",
      "staff",
      "inventory",
      "expenses",
      "reports",
      "promotions",
      "profile",
    ],
    canManageBranches: false,
    canManageBilling: false,
    canInviteStaff: false,
    canManageSettings: false,
    branchScope: "own",
  },
  barber: {
    allowedPages: [...OPS_PAGES, "services", "profile"],
    canManageBranches: false,
    canManageBilling: false,
    canInviteStaff: false,
    canManageSettings: false,
    branchScope: "own",
  },
  cashier: {
    allowedPages: ["dashboard", "queue", "pos", "customers", "profile"],
    canManageBranches: false,
    canManageBilling: false,
    canInviteStaff: false,
    canManageSettings: false,
    branchScope: "own",
  },
};

function normalizeRole(role: string): UserRole {
  if (role in ROLE_PERMISSIONS) return role as UserRole;
  return "barber";
}

export function getPermissions(role: string): RolePermission {
  return ROLE_PERMISSIONS[normalizeRole(role)];
}

export function canAccessPage(role: string, page: string): boolean {
  return getPermissions(role).allowedPages.includes(page);
}

export function canManageBranches(role: string): boolean {
  return getPermissions(role).canManageBranches;
}

export function canManageBilling(role: string): boolean {
  return getPermissions(role).canManageBilling;
}

export function canInviteStaff(role: string): boolean {
  return getPermissions(role).canInviteStaff;
}

export function canManageSettings(role: string): boolean {
  return getPermissions(role).canManageSettings;
}

export function getBranchScope(role: string): BranchScope {
  return getPermissions(role).branchScope;
}

export function isOwnerOrManager(role: string): boolean {
  return role === "owner" || role === "manager";
}

/**
 * Extract the page identifier from a pathname for permission checking.
 * e.g. "/staff/123" -> "staff", "/branches/abc/inventory" -> "branches"
 */
export function pageFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}

/**
 * Branch sub-page tab definitions used in the branch layout.
 */
export type BranchTab = {
  key: string;
  labelKey: string;
  href: string;
};

export function getBranchTabs(role: string): BranchTab[] {
  const all: BranchTab[] = [
    { key: "overview", labelKey: "Overview", href: "" },
    { key: "settings", labelKey: "Settings", href: "/settings" },
  ];

  const r = normalizeRole(role);
  if (r === "owner") return all;
  if (r === "manager") return all.filter((t) => t.key === "overview");
  return all.filter((t) => t.key === "overview");
}
