/**
 * Finance Calculator — authoritative server-side monetary computation.
 *
 * All POS and queue payment flows MUST use these functions to derive
 * subtotal, tax, and total instead of trusting client-supplied values.
 */

import { SST_RATE } from "@/lib/malaysian-tax";
import { roundMYR, type ItemType } from "./constants";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LineItemInput = {
  itemType: ItemType;
  unitPrice: number;
  quantity: number;
  staffId: string | null;
  serviceId: string | null;
  inventoryItemId: string | null;
  name: string;
};

export type ComputedLineItem = LineItemInput & {
  lineTotal: number;
};

export type TransactionTotals = {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: ComputedLineItem[];
};

// ─── Line-level computation ─────────────────────────────────────────────────

export function computeLineTotal(unitPrice: number, quantity: number): number {
  return roundMYR(unitPrice * quantity);
}

// ─── Transaction-level computation ──────────────────────────────────────────

/**
 * Compute authoritative totals from line items.
 * SST is always computed on top of subtotal (exclusive model).
 */
export function computeTransactionTotals(
  items: LineItemInput[],
  discountAmount = 0
): TransactionTotals {
  const computedItems: ComputedLineItem[] = items.map((item) => ({
    ...item,
    lineTotal: computeLineTotal(item.unitPrice, item.quantity),
  }));

  const subtotal = roundMYR(computedItems.reduce((sum, i) => sum + i.lineTotal, 0));
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = roundMYR(taxableSubtotal * SST_RATE);
  const totalAmount = roundMYR(taxableSubtotal + taxAmount);

  return {
    subtotal,
    taxAmount,
    discountAmount: roundMYR(discountAmount),
    totalAmount,
    items: computedItems,
  };
}

/**
 * Back-split SST from a total that is assumed to be SST-inclusive.
 * Used for queue payment flow where the amount is pre-determined.
 */
export function splitSstFromTotal(total: number): {
  subtotal: number;
  taxAmount: number;
} {
  const subtotal = roundMYR(total / (1 + SST_RATE));
  const taxAmount = roundMYR(total - subtotal);
  return { subtotal, taxAmount };
}

// ─── Validation ─────────────────────────────────────────────────────────────

export type TotalValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validate that client-supplied totals match server-computed values
 * within rounding tolerance.
 */
export function validateClientTotals(
  clientSubtotal: number,
  clientTaxAmount: number,
  clientTotalAmount: number,
  serverTotals: TransactionTotals,
  tolerance = 0.02
): TotalValidationResult {
  const subDiff = Math.abs(clientSubtotal - serverTotals.subtotal);
  const taxDiff = Math.abs(clientTaxAmount - serverTotals.taxAmount);
  const totalDiff = Math.abs(clientTotalAmount - serverTotals.totalAmount);

  if (subDiff > tolerance) {
    return {
      valid: false,
      reason: `Subtotal mismatch: client=${clientSubtotal}, server=${serverTotals.subtotal}`,
    };
  }
  if (taxDiff > tolerance) {
    return {
      valid: false,
      reason: `Tax mismatch: client=${clientTaxAmount}, server=${serverTotals.taxAmount}`,
    };
  }
  if (totalDiff > tolerance) {
    return {
      valid: false,
      reason: `Total mismatch: client=${clientTotalAmount}, server=${serverTotals.totalAmount}`,
    };
  }
  return { valid: true };
}

/**
 * Verify the fundamental accounting identity for a transaction:
 * subtotal - discount + tax === total (within rounding tolerance).
 */
export function verifyTransactionIdentity(
  subtotal: number,
  discount: number,
  tax: number,
  total: number,
  tolerance = 0.02
): TotalValidationResult {
  const expected = roundMYR(subtotal - discount + tax);
  const diff = Math.abs(expected - total);
  if (diff > tolerance) {
    return {
      valid: false,
      reason: `Identity violation: subtotal(${subtotal}) - discount(${discount}) + tax(${tax}) = ${expected}, but total = ${total}`,
    };
  }
  return { valid: true };
}
