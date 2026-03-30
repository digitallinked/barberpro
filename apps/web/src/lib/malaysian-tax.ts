/**
 * Malaysian Statutory Contributions & Tax Calculations
 *
 * Rates effective 2024/2025:
 * - EPF (KWSP): Kumpulan Wang Simpanan Pekerja Act 1991
 * - SOCSO (PERKESO): Social Security Act 1969 — First Category
 * - EIS (SIP): Employment Insurance System Act 2017
 * - PCB/MTD: Schedular Tax Deduction — Income Tax Act 1967
 * - SST: Service Tax Act 2018 (8% effective March 1, 2024)
 */

// ─── SST ────────────────────────────────────────────────────────────────────

/** Service Tax rate effective 1 March 2024 (raised from 6% to 8%) */
export const SST_RATE = 0.08;

/** SST registration threshold: RM500,000 annual taxable turnover */
export const SST_THRESHOLD_RM = 500_000;

// ─── EPF (KWSP) ─────────────────────────────────────────────────────────────

export interface EpfResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeRate: number;
  employerRate: number;
}

/**
 * Calculate EPF contributions.
 * @param grossWage  Monthly gross wage (RM)
 * @param age        Employee age (default 30)
 */
export function calculateEpf(grossWage: number, age = 30): EpfResult {
  const above60 = age >= 60;

  // Employee rates: 11% (< 60) | 5.5% (≥ 60)
  const employeeRate = above60 ? 0.055 : 0.11;

  // Employer rates: 13% (wage ≤ RM5,000, < 60) | 12% (wage > RM5,000, < 60) | 4% (≥ 60)
  let employerRate: number;
  if (above60) {
    employerRate = 0.04;
  } else if (grossWage <= 5_000) {
    employerRate = 0.13;
  } else {
    employerRate = 0.12;
  }

  const employeeContribution = round2(grossWage * employeeRate);
  const employerContribution = round2(grossWage * employerRate);

  return {
    employeeContribution,
    employerContribution,
    totalContribution: round2(employeeContribution + employerContribution),
    employeeRate,
    employerRate,
  };
}

// ─── SOCSO (PERKESO) ─────────────────────────────────────────────────────────

export interface SocsoResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  applicable: boolean;
  reason?: string;
}

/**
 * Calculate SOCSO First Category contributions (Employment Injury + Invalidity).
 * Not applicable for employees aged 60 and above.
 * Insurable wages capped at RM5,000/month.
 * @param grossWage  Monthly gross wage (RM)
 * @param age        Employee age (default 30)
 */
export function calculateSocso(grossWage: number, age = 30): SocsoResult {
  if (age >= 60) {
    return {
      employeeContribution: 0,
      employerContribution: 0,
      totalContribution: 0,
      applicable: false,
      reason: "Employee aged 60 and above — SOCSO not applicable",
    };
  }

  // Insurable wage cap: RM5,000
  const insurable = Math.min(grossWage, 5_000);

  // Approximation: employee ~0.5%, employer ~1.75% (table-based but close for mid-range)
  const employeeContribution = round2(insurable * 0.005);
  const employerContribution = round2(insurable * 0.0175);

  return {
    employeeContribution,
    employerContribution,
    totalContribution: round2(employeeContribution + employerContribution),
    applicable: true,
  };
}

// ─── EIS (SIP) ───────────────────────────────────────────────────────────────

export interface EisResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  applicable: boolean;
  reason?: string;
}

/**
 * Calculate EIS contributions (0.2% employee + 0.2% employer).
 * Not applicable for employees aged 60 and above.
 * Insurable wages capped at RM5,000/month.
 * @param grossWage  Monthly gross wage (RM)
 * @param age        Employee age (default 30)
 */
export function calculateEis(grossWage: number, age = 30): EisResult {
  if (age >= 60) {
    return {
      employeeContribution: 0,
      employerContribution: 0,
      totalContribution: 0,
      applicable: false,
      reason: "Employee aged 60 and above — EIS not applicable",
    };
  }

  const insurable = Math.min(grossWage, 5_000);
  const employeeContribution = round2(insurable * 0.002);
  const employerContribution = round2(insurable * 0.002);

  return {
    employeeContribution,
    employerContribution,
    totalContribution: round2(employeeContribution + employerContribution),
    applicable: true,
  };
}

// ─── PCB / MTD ───────────────────────────────────────────────────────────────

export type MaritalStatus = "single" | "married_spouse_no_income" | "married_spouse_income";

export interface PcbOptions {
  maritalStatus?: MaritalStatus;
  numDependents?: number;
  monthlyEpfEmployee?: number;
}

export interface PcbResult {
  monthlyPcb: number;
  annualEstimatedTax: number;
  annualChargeableIncome: number;
  annualRelief: number;
}

/**
 * Resident individual progressive tax — marginal slices (YA 2024 / LHDN schedule pattern).
 * Aligns with common published band widths; verify against current LHDN gazette yearly.
 */
const RESIDENT_TAX_SLICES: { width: number; rate: number }[] = [
  { width: 5_000, rate: 0 },
  { width: 15_000, rate: 0.01 },
  { width: 15_000, rate: 0.03 },
  { width: 15_000, rate: 0.08 },
  { width: 20_000, rate: 0.13 },
  { width: 30_000, rate: 0.21 },
  { width: 300_000, rate: 0.24 },
  { width: 200_000, rate: 0.25 },
  { width: 1_400_000, rate: 0.26 },
  { width: Infinity, rate: 0.28 },
];

function progressiveResidentTax(chargeableIncome: number): number {
  let remaining = Math.max(0, chargeableIncome);
  let tax = 0;
  for (const { width, rate } of RESIDENT_TAX_SLICES) {
    if (remaining <= 0) break;
    const w = width === Infinity ? remaining : width;
    const slice = Math.min(remaining, w);
    tax += slice * rate;
    remaining -= slice;
  }
  return round2(tax);
}

/** Individual relief (mandatory) — YA reference figure; confirm LHDN each year */
export const PERSONAL_RELIEF = 9_000;
const SPOUSE_RELIEF   = 4_000;       // Spouse (not working)
const CHILD_RELIEF    = 2_000;       // Per child (basic)
const EPF_RELIEF_CAP  = 4_000;       // EPF/life insurance relief (combined cap RM7,000; EPF alone RM4,000)

/**
 * Simplified Schedular Tax Deduction (PCB/MTD) calculator.
 * Uses annual income projection; ignores mid-year joiners and prior deductions.
 * @param monthlyGross  Monthly gross wage before statutory deductions (RM)
 * @param options       PcbOptions
 */
export function calculatePcb(monthlyGross: number, options: PcbOptions = {}): PcbResult {
  const { maritalStatus = "single", numDependents = 0, monthlyEpfEmployee = 0 } = options;

  const annualGross = monthlyGross * 12;

  // Relief computation
  let annualRelief = PERSONAL_RELIEF;
  if (maritalStatus === "married_spouse_no_income") annualRelief += SPOUSE_RELIEF;
  annualRelief += Math.min(monthlyEpfEmployee * 12, EPF_RELIEF_CAP);
  annualRelief += numDependents * CHILD_RELIEF;

  const annualChargeableIncome = Math.max(0, annualGross - annualRelief);
  const annualEstimatedTax = progressiveResidentTax(annualChargeableIncome);
  const monthlyPcb = round2(annualEstimatedTax / 12);

  return {
    monthlyPcb,
    annualEstimatedTax: round2(annualEstimatedTax),
    annualChargeableIncome: round2(annualChargeableIncome),
    annualRelief: round2(annualRelief),
  };
}

// ─── Combined Statutory Deductions ──────────────────────────────────────────

export interface StatutoryBreakdown {
  grossWage: number;
  epf: EpfResult;
  socso: SocsoResult;
  eis: EisResult;
  pcb: PcbResult;
  totalEmployeeDeductions: number;
  employeeNetTakeHome: number;
  totalEmployerCost: number;
}

/**
 * Calculate all Malaysian statutory deductions for an employee.
 * @param grossWage     Monthly gross wage (RM)
 * @param age           Employee age (default 30)
 * @param pcbOptions    PCB calculation options
 */
export function calculateStatutoryDeductions(
  grossWage: number,
  age = 30,
  pcbOptions: PcbOptions = {}
): StatutoryBreakdown {
  const epf   = calculateEpf(grossWage, age);
  const socso = calculateSocso(grossWage, age);
  const eis   = calculateEis(grossWage, age);
  const pcb   = calculatePcb(grossWage, { ...pcbOptions, monthlyEpfEmployee: epf.employeeContribution });

  const totalEmployeeDeductions = round2(
    epf.employeeContribution + socso.employeeContribution + eis.employeeContribution + pcb.monthlyPcb
  );
  const employeeNetTakeHome = round2(grossWage - totalEmployeeDeductions);

  const totalEmployerCost = round2(
    grossWage + epf.employerContribution + socso.employerContribution + eis.employerContribution
  );

  return {
    grossWage,
    epf,
    socso,
    eis,
    pcb,
    totalEmployeeDeductions,
    employeeNetTakeHome,
    totalEmployerCost,
  };
}

// ─── Annual Tax Summary (Self-Employed / Form B) ─────────────────────────────

export interface AnnualTaxSummary {
  assessmentYear: number;
  grossRevenue: number;
  allowableExpenses: number;
  netBusinessIncome: number;
  personalRelief: number;
  chargeableIncome: number;
  estimatedTax: number;
  effectiveTaxRatePct: number;
  monthlyInstalment: number;
}

/**
 * Estimate annual income tax for a self-employed individual (Form B).
 * @param grossRevenue       Total business revenue for the year (RM)
 * @param allowableExpenses  Deductible business expenses (RM)
 * @param relief             Total personal/statutory relief (RM) — default RM9,000
 * @param assessmentYear     Override assessment year (default: current year − 1)
 */
export function calculateAnnualTax(
  grossRevenue: number,
  allowableExpenses: number,
  relief = PERSONAL_RELIEF,
  assessmentYear?: number
): AnnualTaxSummary {
  const year = assessmentYear ?? new Date().getFullYear() - 1;
  const netBusinessIncome = Math.max(0, grossRevenue - allowableExpenses);
  const chargeableIncome  = Math.max(0, netBusinessIncome - relief);
  const estimatedTax = progressiveResidentTax(chargeableIncome);
  const effectiveTaxRatePct = grossRevenue > 0 ? round2((estimatedTax / grossRevenue) * 100) : 0;

  return {
    assessmentYear:      year,
    grossRevenue:        round2(grossRevenue),
    allowableExpenses:   round2(allowableExpenses),
    netBusinessIncome:   round2(netBusinessIncome),
    personalRelief:      round2(relief),
    chargeableIncome:    round2(chargeableIncome),
    estimatedTax:        round2(estimatedTax),
    effectiveTaxRatePct,
    monthlyInstalment:   round2(estimatedTax / 12),
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Malaysian income tax brackets for display */
export const TAX_BRACKETS_DISPLAY = [
  { range: "Up to RM5,000",              rate: "0%" },
  { range: "RM5,001 – RM20,000",         rate: "1%" },
  { range: "RM20,001 – RM35,000",        rate: "3%" },
  { range: "RM35,001 – RM50,000",        rate: "8%" },
  { range: "RM50,001 – RM70,000",        rate: "13%" },
  { range: "RM70,001 – RM100,000",       rate: "21%" },
  { range: "RM100,001 – RM400,000",      rate: "24%" },
  { range: "RM400,001 – RM600,000",      rate: "25%" },
  { range: "RM600,001 – RM2,000,000",    rate: "26%" },
  { range: "Above RM2,000,000",          rate: "28%" },
];
