import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Home,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { type AdminRole } from "./permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this nav item. Omit to show to all roles. */
  roles?: AdminRole[];
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Tenants", href: "/tenants", icon: Building2, roles: ["super_admin", "support"] },
      { label: "Users", href: "/users", icon: Users, roles: ["super_admin", "support"] },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Billing", href: "/billing", icon: CreditCard, roles: ["super_admin", "accounts"] },
      { label: "Reports", href: "/reports", icon: BarChart3, roles: ["super_admin", "reports_viewer"] },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blog", href: "/blog", icon: FileText, roles: ["super_admin"] },
      { label: "Announcements", href: "/announcements", icon: Megaphone, roles: ["super_admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: ShieldCheck, roles: ["super_admin"] },
      { label: "Settings", href: "/settings", icon: Settings, roles: ["super_admin"] },
      { label: "Staff", href: "/staff", icon: UserCog, roles: ["super_admin"] },
    ],
  },
];

/** Flat list for backward compat */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
