/**
 * Finance domain constants — single source of truth for monetary rules,
 * payment lifecycle, and revenue recognition across the application.
 */

// ─── Payment Status Lifecycle ───────────────────────────────────────────────
// Canonical statuses for transactions. Only 'paid' counts as recognized revenue.

export const PAYMENT_STATUSES = ["paid", "voided", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Statuses that count toward revenue in all reports and aggregates. */
export const REVENUE_RECOGNIZED_STATUSES: ReadonlySet<PaymentStatus> = new Set(["paid"]);

/** Statuses that are excluded from revenue but preserved for audit trail. */
export const REVENUE_EXCLUDED_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  "voided",
  "refunded",
]);

export function isRevenueRecognized(status: string): boolean {
  return REVENUE_RECOGNIZED_STATUSES.has(status as PaymentStatus);
}

// ─── Rounding ───────────────────────────────────────────────────────────────

/** Round to 2 decimal places (sen). Used for all monetary values in MYR. */
export function roundMYR(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Maximum allowed rounding tolerance between client-sent and server-computed totals. */
export const ROUNDING_TOLERANCE_MYR = 0.02;

// ─── Transaction Item Types ─────────────────────────────────────────────────

export const ITEM_TYPES = ["service", "product"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

/** Normalize legacy 'retail' type to canonical 'product'. */
export function canonicalItemType(raw: string): ItemType {
  if (raw === "retail") return "product";
  if (raw === "service" || raw === "product") return raw;
  return "service";
}

// ─── Inventory Movement Types ───────────────────────────────────────────────

export const INVENTORY_MOVEMENT_TYPES = [
  "in",
  "restock",
  "adjustment_in",
  "out",
  "sale",
  "adjustment_out",
  "write_off",
  "transfer_in",
  "transfer_out",
] as const;
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export function isStockIncrease(type: string): boolean {
  return type === "in" || type === "restock" || type === "adjustment_in" || type === "transfer_in";
}

export function isStockDecrease(type: string): boolean {
  return (
    type === "out" ||
    type === "sale" ||
    type === "adjustment_out" ||
    type === "write_off" ||
    type === "transfer_out"
  );
}

// ─── Expense Statuses ───────────────────────────────────────────────────────

export const EXPENSE_STATUSES = ["draft", "pending", "paid", "voided"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

// ─── Payroll Period Statuses ────────────────────────────────────────────────

export const PAYROLL_PERIOD_STATUSES = ["draft", "approved", "paid", "voided"] as const;
export type PayrollPeriodStatus = (typeof PAYROLL_PERIOD_STATUSES)[number];

// ─── Source Document Types (for ledger traceability) ────────────────────────

export const SOURCE_DOCUMENT_TYPES = [
  "pos_sale",
  "queue_payment",
  "refund",
  "void",
  "expense",
  "payroll",
  "inventory_restock",
  "inventory_adjustment",
] as const;
export type SourceDocumentType = (typeof SOURCE_DOCUMENT_TYPES)[number];
