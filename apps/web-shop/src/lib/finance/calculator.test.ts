import { describe, it, expect } from "vitest";
import {
  computeLineTotal,
  computeTransactionTotals,
  splitSstFromTotal,
  validateClientTotals,
  verifyTransactionIdentity,
  type LineItemInput,
} from "./calculator";
import { roundMYR } from "./constants";

describe("computeLineTotal", () => {
  it("multiplies unit price by quantity and rounds to 2dp", () => {
    expect(computeLineTotal(35, 1)).toBe(35);
    expect(computeLineTotal(19.99, 3)).toBe(59.97);
    expect(computeLineTotal(12.345, 2)).toBe(24.69);
  });

  it("handles zero quantity", () => {
    expect(computeLineTotal(100, 0)).toBe(0);
  });
});

describe("computeTransactionTotals", () => {
  const haircut: LineItemInput = {
    itemType: "service",
    unitPrice: 35,
    quantity: 1,
    staffId: "s1",
    serviceId: "svc1",
    inventoryItemId: null,
    name: "Haircut",
  };

  const pomade: LineItemInput = {
    itemType: "product",
    unitPrice: 25,
    quantity: 2,
    staffId: null,
    serviceId: null,
    inventoryItemId: "inv1",
    name: "Pomade",
  };

  it("computes correct totals for a single service", () => {
    const result = computeTransactionTotals([haircut]);
    expect(result.subtotal).toBe(35);
    expect(result.taxAmount).toBe(roundMYR(35 * 0.08));
    expect(result.totalAmount).toBe(roundMYR(35 + 35 * 0.08));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].lineTotal).toBe(35);
  });

  it("computes correct totals for mixed items", () => {
    const result = computeTransactionTotals([haircut, pomade]);
    expect(result.subtotal).toBe(85); // 35 + (25 * 2)
    expect(result.taxAmount).toBe(roundMYR(85 * 0.08));
    expect(result.totalAmount).toBe(roundMYR(85 * 1.08));
  });

  it("applies discount before tax calculation", () => {
    const result = computeTransactionTotals([haircut], 5);
    const taxableSubtotal = 35 - 5;
    expect(result.discountAmount).toBe(5);
    expect(result.taxAmount).toBe(roundMYR(taxableSubtotal * 0.08));
    expect(result.totalAmount).toBe(roundMYR(taxableSubtotal * 1.08));
  });

  it("handles empty items", () => {
    const result = computeTransactionTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it("discount cannot exceed subtotal for tax purposes", () => {
    const result = computeTransactionTotals([haircut], 100);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});

describe("splitSstFromTotal", () => {
  it("back-calculates SST-inclusive amount correctly", () => {
    const result = splitSstFromTotal(37.8); // 35 * 1.08
    expect(result.subtotal).toBe(35);
    expect(result.taxAmount).toBe(2.8);
  });

  it("handles zero", () => {
    const result = splitSstFromTotal(0);
    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it("subtotal + tax always equals original total", () => {
    const totals = [10.5, 37.8, 100, 250.50, 1234.56];
    for (const total of totals) {
      const result = splitSstFromTotal(total);
      expect(roundMYR(result.subtotal + result.taxAmount)).toBe(roundMYR(total));
    }
  });
});

describe("validateClientTotals", () => {
  it("passes when client matches server exactly", () => {
    const serverTotals = computeTransactionTotals([
      { itemType: "service", unitPrice: 35, quantity: 1, staffId: "s1", serviceId: null, inventoryItemId: null, name: "Cut" },
    ]);
    const result = validateClientTotals(
      serverTotals.subtotal,
      serverTotals.taxAmount,
      serverTotals.totalAmount,
      serverTotals
    );
    expect(result.valid).toBe(true);
  });

  it("passes within rounding tolerance", () => {
    const serverTotals = computeTransactionTotals([
      { itemType: "service", unitPrice: 35, quantity: 1, staffId: "s1", serviceId: null, inventoryItemId: null, name: "Cut" },
    ]);
    const result = validateClientTotals(
      serverTotals.subtotal + 0.01,
      serverTotals.taxAmount,
      serverTotals.totalAmount + 0.01,
      serverTotals
    );
    expect(result.valid).toBe(true);
  });

  it("fails when client total is manipulated", () => {
    const serverTotals = computeTransactionTotals([
      { itemType: "service", unitPrice: 35, quantity: 1, staffId: "s1", serviceId: null, inventoryItemId: null, name: "Cut" },
    ]);
    const result = validateClientTotals(
      serverTotals.subtotal,
      serverTotals.taxAmount,
      serverTotals.totalAmount - 10,
      serverTotals
    );
    expect(result.valid).toBe(false);
  });
});

describe("verifyTransactionIdentity", () => {
  it("passes for correct identity", () => {
    const sub = 100;
    const disc = 10;
    const tax = roundMYR(90 * 0.08);
    const total = roundMYR(90 + tax);
    expect(verifyTransactionIdentity(sub, disc, tax, total).valid).toBe(true);
  });

  it("fails for broken identity", () => {
    expect(verifyTransactionIdentity(100, 0, 8, 200).valid).toBe(false);
  });
});
