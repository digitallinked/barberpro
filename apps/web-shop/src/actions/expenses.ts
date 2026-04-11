"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext, getAuthContextWithBranch } from "./_helpers";

export async function createExpense(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId, effectiveBranchId } = await getAuthContextWithBranch();

    const category = formData.get("category") as string;
    const vendor = (formData.get("vendor") as string) || null;
    const amount = Number(formData.get("amount")) || 0;
    const payment_method = formData.get("payment_method") as string;
    const expense_date = formData.get("expense_date") as string;
    const notes = (formData.get("notes") as string) || null;
    const branch_id = (formData.get("branch_id") as string) || effectiveBranchId || null;
    const receipt_url = (formData.get("receipt_url") as string) || null;

    if (!category || !payment_method || !expense_date) {
      return { success: false, error: "Category, payment method, and expense date are required" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const { data, error } = await supabase.from("expenses").insert({
      tenant_id: tenantId,
      category,
      vendor: vendor || null,
      amount,
      payment_method,
      expense_date,
      notes: notes || null,
      branch_id: branch_id || null,
      created_by: appUserId,
      receipt_url: receipt_url || null,
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

    const category = formData.get("category") as string;
    const vendor = (formData.get("vendor") as string) || null;
    const amount = Number(formData.get("amount")) || 0;
    const payment_method = formData.get("payment_method") as string;
    const expense_date = formData.get("expense_date") as string;
    const notes = (formData.get("notes") as string) || null;
    // receipt_url: only update if explicitly provided (empty string = cleared, null key = untouched)
    const receiptUrlRaw = formData.get("receipt_url");

    if (!category || !payment_method || !expense_date) {
      return { success: false, error: "Category, payment method, and expense date are required" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // Never overwrite branch_id on edit — it's set at creation time and should not change
    const updateData: Record<string, unknown> = {
      category,
      vendor: vendor || null,
      amount,
      payment_method,
      expense_date,
      notes: notes || null,
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
