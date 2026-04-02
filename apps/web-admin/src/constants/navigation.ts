import {
  BarChart3,
  Building2,
  CreditCard,
  Home,
  ShieldCheck,
  Settings,
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

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Tenants", href: "/tenants", icon: Building2, roles: ["super_admin", "support"] },
  { label: "Users", href: "/users", icon: Users, roles: ["super_admin", "support"] },
  { label: "Billing", href: "/billing", icon: CreditCard, roles: ["super_admin", "accounts"] },
  { label: "Platform Reports", href: "/reports", icon: BarChart3, roles: ["super_admin", "reports_viewer"] },
  { label: "Audit Logs", href: "/audit-logs", icon: ShieldCheck, roles: ["super_admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["super_admin"] },
  { label: "Staff", href: "/staff", icon: UserCog, roles: ["super_admin"] },
];
