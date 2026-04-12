"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import {
  calculateStaffCommission,
  getAttendanceSummaryForPeriod,
} from "@/lib/payroll-calculator";
import { calculateStatutoryDeductions } from "@/lib/malaysian-tax";
import {
  payrollPeriodSchema,
  payrollStatusSchema,
  payrollEntrySchema,
} from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";
import { logger } from "@/lib/logger";

export async function createPayrollPeriod(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const parsed = payrollPeriodSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { period_start, period_end, branch_id } = parsed.data;

    const { error } = await supabase.from("payroll_periods").insert({
      tenant_id: tenantId,
      period_start,
      period_end,
      branch_id: branch_id ?? null,
      status: "draft",
      created_by: appUserId,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updatePayrollPeriodStatus(id: string, status: string) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const statusParsed = payrollStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      return { success: false, error: statusParsed.error.issues[0].message };
    }

    const validStatus = statusParsed.data;
    const updateData: Record<string, unknown> = {
      status: validStatus,
      updated_at: new Date().toISOString(),
    };

    if (validStatus === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = appUserId;
    }

    const { error } = await supabase
      .from("payroll_periods")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    // When a period is marked as paid, auto-record two expense lines:
    // 1. Total gross salaries (category: salary)
    // 2. Total employer statutory contributions (category: employer_statutory)
    if (validStatus === "paid") {
      await recordPayrollExpenses(supabase, tenantId, appUserId, id);
    }

    revalidatePath("/[branchSlug]/payroll", "page");
    revalidatePath("/[branchSlug]/expenses", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function recordPayrollExpenses(
  supabase: Awaited<ReturnType<typeof getAuthContext>>["supabase"],
  tenantId: string,
  appUserId: string,
  periodId: string
) {
  // Fetch the period details
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, name, period_start, period_end, branch_id")
    .eq("id", periodId)
    .eq("tenant_id", tenantId)
    .single();

  if (!period) return;

  // Fetch all entries with staff profile for statutory calculations
  const { data: entries } = await supabase
    .from("payroll_entries")
    .select(`
      id, base_salary, service_commission, product_commission, bonuses,
      staff_id,
      staff_profiles!payroll_entries_staff_id_fkey (
        date_of_birth, epf_enabled, socso_enabled, full_name
      )
    `)
    .eq("payroll_period_id", periodId)
    .eq("tenant_id", tenantId);

  if (!entries || entries.length === 0) return;

  // Skip if expenses already recorded for this period to avoid duplicates
  const { data: existing } = await supabase
    .from("expenses")
    .select("id")
    .eq("payroll_period_id", periodId)
    .eq("tenant_id", tenantId)
    .limit(1);

  if (existing && existing.length > 0) return;

  let totalGross = 0;
  let totalEpfEmployer = 0;
  let totalSocsoEmployer = 0;
  let totalEisEmployer = 0;

  for (const entry of entries) {
    const gross = entry.base_salary + entry.service_commission + entry.product_commission + entry.bonuses;
    totalGross += gross;

    const profile = Array.isArray(entry.staff_profiles) ? entry.staff_profiles[0] : entry.staff_profiles;
    const dob = (profile as Record<string, unknown> | null)?.date_of_birth as string | null;
    const epfEnabled = (profile as Record<string, unknown> | null)?.epf_enabled as boolean | null;
    const socsoEnabled = (profile as Record<string, unknown> | null)?.socso_enabled as boolean | null;

    let age = 30;
    if (dob) {
      const born = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - born.getFullYear();
      if (today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) age--;
    }

    const stat = calculateStatutoryDeductions(gross, age);
    if (epfEnabled !== false) totalEpfEmployer += stat.epf.employerContribution;
    if (socsoEnabled !== false) totalSocsoEmployer += stat.socso.employerContribution;
    totalEisEmployer += stat.eis.employerContribution;
  }

  const totalEmployerStatutory = Math.round((totalEpfEmployer + totalSocsoEmployer + totalEisEmployer) * 100) / 100;
  const expenseDate = period.period_end; // Record against pay period end date

  const expensesToInsert = [
    {
      tenant_id: tenantId,
      branch_id: period.branch_id ?? null,
      payroll_period_id: periodId,
      category: "salary",
      vendor: null as string | null,
      amount: Math.round(totalGross * 100) / 100,
      payment_method: "bank_transfer",
      expense_date: expenseDate,
      status: "paid",
      notes: `Gross salaries — ${period.name} (${entries.length} staff). Includes base salary, commissions, and bonuses. Net pay to employees is after statutory and other deductions.`,
      created_by: appUserId,
    },
    ...(totalEmployerStatutory > 0 ? [{
      tenant_id: tenantId,
      branch_id: period.branch_id ?? null,
      payroll_period_id: periodId,
      category: "employer_statutory",
      vendor: null as string | null,
      amount: totalEmployerStatutory,
      payment_method: "bank_transfer",
      expense_date: expenseDate,
      status: "paid",
      notes: `Employer statutory contributions — ${period.name}. EPF employer: RM ${totalEpfEmployer.toFixed(2)}, SOCSO: RM ${totalSocsoEmployer.toFixed(2)}, EIS: RM ${totalEisEmployer.toFixed(2)}. Figures are estimates; verify with KWSP/PERKESO portals.`,
      created_by: appUserId,
    }] : []),
  ];

  await supabase.from("expenses").insert(expensesToInsert);
}

export async function createPayrollEntry(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = payrollEntrySchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      payroll_period_id,
      staff_id,
      base_salary,
      service_commission,
      product_commission,
      bonuses,
      deductions,
      advances,
      notes,
      days_worked,
      total_working_days,
      service_revenue,
      product_revenue,
      services_count,
      customers_served,
    } = parsed.data;

    const net_payout =
      base_salary + service_commission + product_commission + bonuses - deductions - advances;

    const { error } = await supabase.from("payroll_entries").insert({
      tenant_id: tenantId,
      payroll_period_id,
      staff_id,
      base_salary,
      service_commission,
      product_commission,
      bonuses,
      deductions,
      advances,
      net_payout,
      notes,
      days_worked,
      total_working_days,
      service_revenue,
      product_revenue,
      services_count,
      customers_served,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updatePayrollEntry(entryId: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    // Use the entry schema minus period/staff IDs which aren't updated
    const updateSchema = payrollEntrySchema.omit({ payroll_period_id: true, staff_id: true });
    const parsed = updateSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      base_salary,
      service_commission,
      product_commission,
      bonuses,
      deductions,
      advances,
      notes,
      days_worked,
      total_working_days,
      service_revenue,
      product_revenue,
      services_count,
      customers_served,
    } = parsed.data;

    const net_payout =
      base_salary + service_commission + product_commission + bonuses - deductions - advances;

    const { error } = await supabase
      .from("payroll_entries")
      .update({
        base_salary,
        service_commission,
        product_commission,
        bonuses,
        deductions,
        advances,
        net_payout,
        notes,
        days_worked,
        total_working_days,
        service_revenue,
        product_revenue,
        services_count,
        customers_served,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deletePayrollEntry(entryId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("payroll_entries")
      .delete()
      .eq("id", entryId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function generatePayrollEntries(periodId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { data: period, error: periodError } = await supabase
      .from("payroll_periods")
      .select("id, period_start, period_end, status, branch_id")
      .eq("id", periodId)
      .eq("tenant_id", tenantId)
      .single();

    if (periodError || !period) {
      return { success: false, error: "Payroll period not found" };
    }

    if (period.status === "approved" || period.status === "paid") {
      return { success: false, error: "Cannot generate entries for approved or paid periods" };
    }

    let staffQuery = supabase
      .from("staff_profiles")
      .select(
        `
        id,
        base_salary,
        app_users!inner (id, full_name, is_active, branch_id)
      `
      )
      .eq("tenant_id", tenantId);

    const { data: staffData, error: staffError } = await staffQuery;

    if (staffError || !staffData) {
      return { success: false, error: "Failed to fetch staff" };
    }

    const activeStaff = (staffData as Array<Record<string, unknown>>).filter((s) => {
      const appUser = Array.isArray(s.app_users) ? s.app_users[0] : s.app_users;
      const user = appUser as Record<string, unknown> | null;
      if (!user || user.is_active !== true) return false;
      if (period.branch_id && user.branch_id !== period.branch_id) return false;
      return true;
    });

    const { data: existingEntries } = await supabase
      .from("payroll_entries")
      .select("staff_id")
      .eq("payroll_period_id", periodId);

    const existingStaffIds = new Set(
      (existingEntries ?? []).map((e) => e.staff_id)
    );

    let generated = 0;
    let alreadyHadCount = 0;

    for (const staff of activeStaff) {
      const staffProfileId = staff.id as string;
      if (existingStaffIds.has(staffProfileId)) {
        alreadyHadCount++;
        continue;
      }

      const baseSalary = (staff.base_salary as number) || 0;

      const [commission, attendance] = await Promise.all([
        calculateStaffCommission(
          supabase,
          tenantId,
          staffProfileId,
          period.period_start,
          period.period_end
        ),
        getAttendanceSummaryForPeriod(
          supabase,
          tenantId,
          staffProfileId,
          period.period_start,
          period.period_end
        ),
      ]);

      const net_payout =
        baseSalary +
        commission.serviceCommission +
        commission.productCommission;

      const { error: insertError } = await supabase.from("payroll_entries").insert({
        tenant_id: tenantId,
        payroll_period_id: periodId,
        staff_id: staffProfileId,
        base_salary: baseSalary,
        service_commission: commission.serviceCommission,
        product_commission: commission.productCommission,
        bonuses: 0,
        deductions: 0,
        advances: 0,
        net_payout,
        days_worked: attendance.daysWorked,
        total_working_days: attendance.totalWorkingDays,
        service_revenue: commission.serviceRevenue,
        product_revenue: commission.productRevenue,
        services_count: commission.servicesCount,
        customers_served: commission.customersServed,
      });

      if (!insertError) {
        generated++;
      } else {
        logger.error("[generatePayrollEntries] Insert failed for staff", insertError, {
          action: "generatePayrollEntries",
        });
      }
    }

    revalidatePath("/[branchSlug]/payroll", "page");
    return {
      success: true,
      generated,
      alreadyHad: alreadyHadCount,
      total: activeStaff.length,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
