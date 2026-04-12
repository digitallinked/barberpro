"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext, getAuthContextWithBranch } from "./_helpers";
import { expenseSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createExpense(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId, effectiveBranchId } = await getAuthContextWithBranch();

    const raw = formDataToObject(formData);
    const parsed = expenseSchema.safeParse({
      ...raw,
      branch_id: raw.branch_id || effectiveBranchId || null,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { category, vendor, amount, payment_method, expense_date, notes, branch_id, receipt_url } = parsed.data;

    const { data, error } = await supabase.from("expenses").insert({
      tenant_id: tenantId,
      category,
      vendor,
      amount,
      payment_method,
      expense_date,
      notes,
      branch_id,
      created_by: appUserId,
      receipt_url,
    }).select("id").single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/expenses", "page");
    return { success: true, id: data?.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateExpense(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    // receipt_url: only update if explicitly provided (empty string = cleared, null key = untouched)
    const receiptUrlRaw = formData.get("receipt_url");
    const parsed = expenseSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { category, vendor, amount, payment_method, expense_date, notes } = parsed.data;

    // Never overwrite branch_id on edit — it's set at creation time and should not change
    const updateData: Record<string, unknown> = {
      category,
      vendor,
      amount,
      payment_method,
      expense_date,
      notes,
      updated_at: new Date().toISOString(),
    };

    // Only touch receipt_url if the form explicitly sent a value
    if (receiptUrlRaw !== null) {
      updateData.receipt_url = (receiptUrlRaw as string) || null;
    }

    const { error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/expenses", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateExpenseStatus(id: string, status: "paid" | "pending") {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("expenses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/expenses", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteExpense(id: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/expenses", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
