import { describe, it, expect } from "vitest";
import {
  calculateEpf,
  calculateSocso,
  calculateEis,
  calculatePcb,
  calculateStatutoryDeductions,
  calculateAnnualTax,
  SST_RATE,
  PERSONAL_RELIEF,
} from "./malaysian-tax";

describe("SST_RATE", () => {
  it("is 8% as of 1 March 2024", () => {
    expect(SST_RATE).toBe(0.08);
  });
});

describe("calculateEpf", () => {
  it("uses 11% employee rate under 60", () => {
    const result = calculateEpf(3000, 30);
    expect(result.employeeRate).toBe(0.11);
    expect(result.employeeContribution).toBe(330);
  });

  it("uses 13% employer rate for wage <= 5000", () => {
    const result = calculateEpf(3000, 30);
    expect(result.employerRate).toBe(0.13);
    expect(result.employerContribution).toBe(390);
  });

  it("uses 12% employer rate for wage > 5000", () => {
    const result = calculateEpf(8000, 30);
    expect(result.employerRate).toBe(0.12);
    expect(result.employerContribution).toBe(960);
  });

  it("uses reduced rates for age >= 60", () => {
    const result = calculateEpf(3000, 62);
    expect(result.employeeRate).toBe(0.055);
    expect(result.employerRate).toBe(0.04);
  });

  it("total = employee + employer", () => {
    const result = calculateEpf(4000);
    expect(result.totalContribution).toBe(
      result.employeeContribution + result.employerContribution
    );
  });
});

describe("calculateSocso", () => {
  it("not applicable for age >= 60", () => {
    const result = calculateSocso(3000, 65);
    expect(result.applicable).toBe(false);
    expect(result.totalContribution).toBe(0);
  });

  it("caps insurable wage at RM5,000", () => {
    const low = calculateSocso(3000, 30);
    const high = calculateSocso(10000, 30);
    const capped = calculateSocso(5000, 30);
    expect(high.totalContribution).toBe(capped.totalContribution);
    expect(low.totalContribution).toBeLessThan(high.totalContribution);
  });
});

describe("calculateEis", () => {
  it("not applicable for age >= 60", () => {
    const result = calculateEis(3000, 65);
    expect(result.applicable).toBe(false);
  });

  it("uses 0.2% employee + 0.2% employer", () => {
    const result = calculateEis(3000, 30);
    expect(result.employeeContribution).toBe(6);
    expect(result.employerContribution).toBe(6);
  });
});

describe("calculatePcb", () => {
  it("returns monthly PCB estimate", () => {
    const result = calculatePcb(5000);
    expect(result.monthlyPcb).toBeGreaterThanOrEqual(0);
    expect(result.annualEstimatedTax).toBeGreaterThanOrEqual(0);
  });

  it("higher income = higher PCB", () => {
    const low = calculatePcb(3000);
    const high = calculatePcb(10000);
    expect(high.monthlyPcb).toBeGreaterThan(low.monthlyPcb);
  });

  it("married spouse no income gets additional relief", () => {
    const single = calculatePcb(5000, { maritalStatus: "single" });
    const married = calculatePcb(5000, { maritalStatus: "married_spouse_no_income" });
    expect(married.annualRelief).toBeGreaterThan(single.annualRelief);
    expect(married.monthlyPcb).toBeLessThanOrEqual(single.monthlyPcb);
  });
});

describe("calculateStatutoryDeductions", () => {
  it("sums all employee deductions correctly", () => {
    const result = calculateStatutoryDeductions(4000, 30);
    const expected =
      result.epf.employeeContribution +
      result.socso.employeeContribution +
      result.eis.employeeContribution +
      result.pcb.monthlyPcb;
    expect(result.totalEmployeeDeductions).toBeCloseTo(expected, 1);
  });

  it("net take home = gross - employee deductions", () => {
    const result = calculateStatutoryDeductions(4000, 30);
    expect(result.employeeNetTakeHome).toBeCloseTo(
      4000 - result.totalEmployeeDeductions,
      1
    );
  });

  it("total employer cost includes employer statutory", () => {
    const result = calculateStatutoryDeductions(4000, 30);
    expect(result.totalEmployerCost).toBeGreaterThan(4000);
  });
});

describe("calculateAnnualTax", () => {
  it("returns zero tax for income below personal relief", () => {
    const result = calculateAnnualTax(8000, 0, PERSONAL_RELIEF);
    expect(result.estimatedTax).toBe(0);
  });

  it("effective rate increases with income", () => {
    const low = calculateAnnualTax(50000, 10000);
    const high = calculateAnnualTax(200000, 10000);
    expect(high.effectiveTaxRatePct).toBeGreaterThan(low.effectiveTaxRatePct);
  });

  it("higher expenses = lower tax", () => {
    const lowExp = calculateAnnualTax(100000, 20000);
    const highExp = calculateAnnualTax(100000, 60000);
    expect(highExp.estimatedTax).toBeLessThan(lowExp.estimatedTax);
  });

  it("monthly instalment is annual / 12", () => {
    const result = calculateAnnualTax(150000, 30000);
    expect(result.monthlyInstalment).toBeCloseTo(result.estimatedTax / 12, 1);
  });
});
