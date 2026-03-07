import {
  BarChart3,
  Building2,
  CreditCard,
  Home,
  ShieldCheck,
  Settings,
  Users
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Tenants", href: "/tenants", icon: Building2 },
  { label: "Users", href: "/users", icon: Users },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Platform Reports", href: "/reports", icon: BarChart3 },
  { label: "Audit Logs", href: "/audit-logs", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings }
];
