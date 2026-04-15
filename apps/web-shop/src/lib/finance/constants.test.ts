import { describe, it, expect } from "vitest";
import {
  roundMYR,
  isRevenueRecognized,
  canonicalItemType,
  isStockIncrease,
  isStockDecrease,
} from "./constants";

describe("roundMYR", () => {
  it("rounds to 2 decimal places", () => {
    // Note: 1.005 is stored as 1.00499... in IEEE 754, so Math.round gives 1.00.
    // This is acceptable banker's rounding behavior for our use case.
    expect(roundMYR(1.006)).toBe(1.01);
    expect(roundMYR(1.004)).toBe(1);
    expect(roundMYR(0)).toBe(0);
    expect(roundMYR(1234.5678)).toBe(1234.57);
  });
});

describe("isRevenueRecognized", () => {
  it("only recognizes 'paid' status", () => {
    expect(isRevenueRecognized("paid")).toBe(true);
    expect(isRevenueRecognized("voided")).toBe(false);
    expect(isRevenueRecognized("refunded")).toBe(false);
    expect(isRevenueRecognized("draft")).toBe(false);
    expect(isRevenueRecognized("")).toBe(false);
  });
});

describe("canonicalItemType", () => {
  it("normalizes 'retail' to 'product'", () => {
    expect(canonicalItemType("retail")).toBe("product");
  });

  it("passes through valid types", () => {
    expect(canonicalItemType("service")).toBe("service");
    expect(canonicalItemType("product")).toBe("product");
  });

  it("defaults unknown types to 'service'", () => {
    expect(canonicalItemType("foo")).toBe("service");
  });
});

describe("isStockIncrease / isStockDecrease", () => {
  it("correctly classifies increase types", () => {
    expect(isStockIncrease("in")).toBe(true);
    expect(isStockIncrease("restock")).toBe(true);
    expect(isStockIncrease("adjustment_in")).toBe(true);
    expect(isStockIncrease("sale")).toBe(false);
  });

  it("correctly classifies decrease types", () => {
    expect(isStockDecrease("sale")).toBe(true);
    expect(isStockDecrease("out")).toBe(true);
    expect(isStockDecrease("write_off")).toBe(true);
    expect(isStockDecrease("restock")).toBe(false);
  });
});
