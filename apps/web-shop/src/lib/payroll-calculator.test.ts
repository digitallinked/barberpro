import { describe, it, expect } from "vitest";
import { commissionAmountsFromScheme, type SchemeRates, type CommissionMetrics } from "./payroll-calculator";

describe("commissionAmountsFromScheme", () => {
  const metrics: CommissionMetrics = {
    serviceRevenue: 1000,
    productRevenue: 500,
    servicesCount: 20,
    customersServed: 15,
  };

  it("returns zero for null scheme", () => {
    const result = commissionAmountsFromScheme(null, metrics);
    expect(result.serviceCommission).toBe(0);
    expect(result.productCommission).toBe(0);
  });

  it("returns zero for inactive scheme", () => {
    const scheme: SchemeRates = {
      percentage_rate: 10,
      per_service_amount: 5,
      per_customer_amount: 3,
      product_commission_rate: 5,
      is_active: false,
    };
    const result = commissionAmountsFromScheme(scheme, metrics);
    expect(result.serviceCommission).toBe(0);
    expect(result.productCommission).toBe(0);
  });

  it("calculates service commission correctly", () => {
    const scheme: SchemeRates = {
      percentage_rate: 10,
      per_service_amount: 5,
      per_customer_amount: 3,
      product_commission_rate: 0,
    };
    const result = commissionAmountsFromScheme(scheme, metrics);
    // 10% of 1000 = 100, + 5 * 20 = 100, + 3 * 15 = 45 => 245
    expect(result.serviceCommission).toBe(245);
  });

  it("calculates product commission correctly", () => {
    const scheme: SchemeRates = {
      percentage_rate: 0,
      per_service_amount: 0,
      per_customer_amount: 0,
      product_commission_rate: 10,
    };
    const result = commissionAmountsFromScheme(scheme, metrics);
    expect(result.productCommission).toBe(50); // 10% of 500
  });

  it("rounds to 2 decimal places", () => {
    const scheme: SchemeRates = {
      percentage_rate: 7.5,
      per_service_amount: 0,
      per_customer_amount: 0,
      product_commission_rate: 3.33,
    };
    const oddMetrics: CommissionMetrics = {
      serviceRevenue: 333,
      productRevenue: 777,
      servicesCount: 0,
      customersServed: 0,
    };
    const result = commissionAmountsFromScheme(scheme, oddMetrics);
    expect(Number.isFinite(result.serviceCommission)).toBe(true);
    expect(Number.isFinite(result.productCommission)).toBe(true);
    expect(result.serviceCommission.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
    expect(result.productCommission.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});
