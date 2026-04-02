export type AdminRole =
  | "super_admin"
  | "accounts"
  | "support"
  | "reports_viewer";

export const ALL_ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "accounts",
  "support",
  "reports_viewer",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  accounts: "Accounts",
  support: "Support",
  reports_viewer: "Reports Viewer",
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "bg-primary/15 text-primary",
  accounts: "bg-green-500/15 text-green-400",
  support: "bg-yellow-500/15 text-yellow-400",
  reports_viewer: "bg-blue-500/15 text-blue-400",
};

/**
 * Maps each role to the route prefixes it is allowed to access.
 * Routes not listed here will be redirected to /dashboard.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    "/dashboard",
    "/tenants",
    "/users",
    "/billing",
    "/reports",
    "/audit-logs",
    "/settings",
    "/staff",
    "/blog",
    "/announcements",
  ],
  accounts: ["/dashboard", "/billing"],
  support: ["/dashboard", "/tenants", "/users"],
  reports_viewer: ["/dashboard", "/reports"],
};

export function canAccess(role: AdminRole, pathname: string): boolean {
  const allowed = ROLE_PERMISSIONS[role] ?? [];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
