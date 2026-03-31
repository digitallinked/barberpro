"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createExpense(formData: FormData) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const category = formData.get("category") as string;
    const vendor = (formData.get("vendor") as string) || null;
    const amount = Number(formData.get("amount")) || 0;
    const payment_method = formData.get("payment_method") as string;
    const expense_date = formData.get("expense_date") as string;
    const notes = (formData.get("notes") as string) || null;
    const branch_id = (formData.get("branch_id") as string) || null;

    if (!category || !payment_method || !expense_date) {
      return { success: false, error: "Category, payment method, and expense date are required" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const { error } = await supabase.from("expenses").insert({
      tenant_id: tenantId,
      category,
      vendor: vendor || null,
      amount,
      payment_method,
      expense_date,
      notes: notes || null,
      branch_id: branch_id || null,
      created_by: appUserId,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/expenses");
    return { success: true };
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
    const branch_id = (formData.get("branch_id") as string) || null;

    if (!category || !payment_method || !expense_date) {
      return { success: false, error: "Category, payment method, and expense date are required" };
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        category,
        vendor: vendor || null,
        amount,
        payment_method,
        expense_date,
        notes: notes || null,
        branch_id: branch_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/expenses");
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

    revalidatePath("/expenses");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
