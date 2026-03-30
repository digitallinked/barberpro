"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import {
  calculateStaffCommission,
  getAttendanceSummaryForPeriod,
} from "@/lib/payroll-calculator";

export async function createPayrollPeriod(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const period_start = formData.get("period_start") as string;
    const period_end = formData.get("period_end") as string;
    const branch_id = (formData.get("branch_id") as string) || null;

    if (!period_start || !period_end) {
      return { success: false, error: "Period start and end dates are required" };
    }

    const { error } = await supabase.from("payroll_periods").insert({
      tenant_id: tenantId,
      period_start,
      period_end,
      branch_id: branch_id || null,
      status: "draft",
      created_by: appUserId,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/payroll");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updatePayrollPeriodStatus(id: string, status: string) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = appUserId;
    }

    const { error } = await supabase
      .from("payroll_periods")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/payroll");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createPayrollEntry(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const payroll_period_id = formData.get("payroll_period_id") as string;
    const staff_id = formData.get("staff_id") as string;
    const base_salary = Number(formData.get("base_salary")) || 0;
    const service_commission = Number(formData.get("service_commission")) || 0;
    const product_commission = Number(formData.get("product_commission")) || 0;
    const bonuses = Number(formData.get("bonuses")) || 0;
    const deductions = Number(formData.get("deductions")) || 0;
    const advances = Number(formData.get("advances")) || 0;
    const notes = (formData.get("notes") as string) || null;
    const days_worked = formData.get("days_worked") ? Number(formData.get("days_worked")) : null;
    const total_working_days = formData.get("total_working_days") ? Number(formData.get("total_working_days")) : null;
    const service_revenue = formData.get("service_revenue") ? Number(formData.get("service_revenue")) : null;
    const product_revenue = formData.get("product_revenue") ? Number(formData.get("product_revenue")) : null;
    const services_count = formData.get("services_count") ? Number(formData.get("services_count")) : null;
    const customers_served = formData.get("customers_served") ? Number(formData.get("customers_served")) : null;

    if (!payroll_period_id || !staff_id) {
      return { success: false, error: "Payroll period and staff are required" };
    }

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
      notes: notes || null,
      days_worked,
      total_working_days,
      service_revenue,
      product_revenue,
      services_count,
      customers_served,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/payroll");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updatePayrollEntry(entryId: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const base_salary = Number(formData.get("base_salary")) || 0;
    const service_commission = Number(formData.get("service_commission")) || 0;
    const product_commission = Number(formData.get("product_commission")) || 0;
    const bonuses = Number(formData.get("bonuses")) || 0;
    const deductions = Number(formData.get("deductions")) || 0;
    const advances = Number(formData.get("advances")) || 0;
    const notes = (formData.get("notes") as string) || null;
    const days_worked = formData.get("days_worked") ? Number(formData.get("days_worked")) : null;
    const total_working_days = formData.get("total_working_days") ? Number(formData.get("total_working_days")) : null;
    const service_revenue = formData.get("service_revenue") ? Number(formData.get("service_revenue")) : null;
    const product_revenue = formData.get("product_revenue") ? Number(formData.get("product_revenue")) : null;
    const services_count = formData.get("services_count") ? Number(formData.get("services_count")) : null;
    const customers_served = formData.get("customers_served") ? Number(formData.get("customers_served")) : null;

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
        notes: notes || null,
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

    revalidatePath("/payroll");
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

    revalidatePath("/payroll");
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

    if (period.status !== "draft") {
      return { success: false, error: "Can only generate entries for draft periods" };
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

    for (const staff of activeStaff) {
      const staffProfileId = staff.id as string;
      if (existingStaffIds.has(staffProfileId)) continue;

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

      if (!insertError) generated++;
    }

    revalidatePath("/payroll");
    return {
      success: true,
      generated,
      skipped: activeStaff.length - generated,
      total: activeStaff.length,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
