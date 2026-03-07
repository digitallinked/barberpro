import {
  BarChart3,
  CalendarCheck2,
  CircleDollarSign,
  ClipboardList,
  Contact2,
  CreditCard,
  Home,
  Package,
  Scissors,
  Settings,
  Store,
  Users,
  Wallet
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Queue", href: "/queue", icon: ClipboardList },
  { label: "Appointments", href: "/appointments", icon: CalendarCheck2 },
  { label: "POS", href: "/pos", icon: CreditCard },
  { label: "Customers", href: "/customers", icon: Contact2 },
  { label: "Staff", href: "/staff", icon: Users },
  { label: "Payroll", href: "/payroll", icon: CircleDollarSign },
  { label: "Commissions", href: "/commissions", icon: Scissors },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Expenses", href: "/expenses", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Branches", href: "/branches", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings }
];
