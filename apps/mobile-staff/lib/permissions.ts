import type { UserRole } from "./auth";

type PermissionMap = {
  canAccessQueue: boolean;
  canAccessSchedule: boolean;
  canAccessPos: boolean;
  canAccessCustomers: boolean;
  canAccessCommissions: boolean;
  canAccessMore: boolean; // manager-only screens
  canManageStaff: boolean;
  canManageServices: boolean;
  canManageInventory: boolean;
  canManageExpenses: boolean;
  canManagePromotions: boolean;
  canViewReports: boolean;
  canEditCustomers: boolean;
};

const ROLE_PERMISSIONS: Record<UserRole, PermissionMap> = {
  owner: {
    canAccessQueue: true,
    canAccessSchedule: true,
    canAccessPos: true,
    canAccessCustomers: true,
    canAccessCommissions: true,
    canAccessMore: true,
    canManageStaff: true,
    canManageServices: true,
    canManageInventory: true,
    canManageExpenses: true,
    canManagePromotions: true,
    canViewReports: true,
    canEditCustomers: true,
  },
  manager: {
    canAccessQueue: true,
    canAccessSchedule: true,
    canAccessPos: true,
    canAccessCustomers: true,
    canAccessCommissions: true,
    canAccessMore: true,
    canManageStaff: true,
    canManageServices: true,
    canManageInventory: true,
    canManageExpenses: true,
    canManagePromotions: true,
    canViewReports: true,
    canEditCustomers: true,
  },
  barber: {
    canAccessQueue: true,
    canAccessSchedule: true,
    canAccessPos: true,
    canAccessCustomers: false,
    canAccessCommissions: true,
    canAccessMore: false,
    canManageStaff: false,
    canManageServices: false,
    canManageInventory: false,
    canManageExpenses: false,
    canManagePromotions: false,
    canViewReports: false,
    canEditCustomers: false,
  },
  cashier: {
    canAccessQueue: true,
    canAccessSchedule: false,
    canAccessPos: true,
    canAccessCustomers: true,
    canAccessCommissions: true,
    canAccessMore: false,
    canManageStaff: false,
    canManageServices: false,
    canManageInventory: false,
    canManageExpenses: false,
    canManagePromotions: false,
    canViewReports: false,
    canEditCustomers: false,
  },
};

export function getPermissions(role: UserRole): PermissionMap {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.barber;
}

export function isOwnerOrManager(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: "Owner",
    manager: "Manager",
    barber: "Barber",
    cashier: "Cashier",
  };
  return labels[role] ?? "Staff";
}
