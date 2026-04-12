"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext, getAuthContextWithBranch } from "./_helpers";
import { inventoryItemSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createInventoryItem(formData: FormData) {
  try {
    const { supabase, tenantId, effectiveBranchId } = await getAuthContextWithBranch();

    const raw = formDataToObject(formData);
    const parsed = inventoryItemSchema.safeParse({
      ...raw,
      branch_id: raw.branch_id || effectiveBranchId || null,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, sku, item_type, unit_cost, sell_price, stock_qty, reorder_level, supplier_id, branch_id } = parsed.data;

    const { error } = await supabase.from("inventory_items").insert({
      tenant_id: tenantId,
      name,
      sku,
      item_type,
      unit_cost,
      sell_price,
      stock_qty,
      reorder_level,
      supplier_id,
      branch_id,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/inventory", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateInventoryItem(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContextWithBranch();

    const parsed = inventoryItemSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, sku, item_type, unit_cost, sell_price, stock_qty, reorder_level, supplier_id, branch_id } = parsed.data;

    const { error } = await supabase
      .from("inventory_items")
      .update({
        name,
        sku,
        item_type,
        unit_cost,
        sell_price,
        stock_qty,
        reorder_level,
        supplier_id,
        branch_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/inventory", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function adjustStock(
  itemId: string,
  quantity: number,
  movementType: string,
  reason: string
) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    const { data: item, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id, stock_qty, branch_id")
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !item) {
      return { success: false, error: fetchError?.message ?? "Item not found" };
    }

    let newQty = item.stock_qty;
    if (movementType === "in" || movementType === "restock" || movementType === "adjustment_in") {
      newQty += quantity;
    } else if (
      movementType === "out" ||
      movementType === "sale" ||
      movementType === "adjustment_out"
    ) {
      newQty -= quantity;
    } else {
      return { success: false, error: "Invalid movement type" };
    }

    if (newQty < 0) {
      return { success: false, error: "Stock quantity cannot be negative" };
    }

    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({
        stock_qty: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);

    if (updateError) return { success: false, error: updateError.message };

    const { error: movementError } = await supabase.from("inventory_movements").insert({
      tenant_id: tenantId,
      inventory_item_id: itemId,
      branch_id: item.branch_id,
      movement_type: movementType,
      quantity: Math.abs(quantity),
      reason: reason || null,
      created_by: appUserId,
    });

    if (movementError) return { success: false, error: movementError.message };

    revalidatePath("/[branchSlug]/inventory", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
