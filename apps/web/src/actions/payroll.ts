"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

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
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/payroll");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
