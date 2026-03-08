"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";

export async function createInventoryItem(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string) || null;
    const item_type = formData.get("item_type") as string;
    const unit_cost = Number(formData.get("unit_cost")) || 0;
    const sell_price = Number(formData.get("sell_price")) || null;
    const stock_qty = Number(formData.get("stock_qty")) || 0;
    const reorder_level = Number(formData.get("reorder_level")) || 0;
    const supplier_id = (formData.get("supplier_id") as string) || null;
    const branch_id = (formData.get("branch_id") as string) || null;

    if (!name || !item_type) {
      return { success: false, error: "Name and item type are required" };
    }

    const { error } = await supabase.from("inventory_items").insert({
      tenant_id: tenantId,
      name,
      sku: sku || null,
      item_type,
      unit_cost,
      sell_price: sell_price ?? null,
      stock_qty,
      reorder_level,
      supplier_id: supplier_id || null,
      branch_id: branch_id || null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateInventoryItem(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string) || null;
    const item_type = formData.get("item_type") as string;
    const unit_cost = Number(formData.get("unit_cost")) || 0;
    const sell_price = Number(formData.get("sell_price")) || null;
    const stock_qty = Number(formData.get("stock_qty")) ?? 0;
    const reorder_level = Number(formData.get("reorder_level")) || 0;
    const supplier_id = (formData.get("supplier_id") as string) || null;
    const branch_id = (formData.get("branch_id") as string) || null;

    if (!name || !item_type) {
      return { success: false, error: "Name and item type are required" };
    }

    const { error } = await supabase
      .from("inventory_items")
      .update({
        name,
        sku: sku || null,
        item_type,
        unit_cost,
        sell_price: sell_price ?? null,
        stock_qty,
        reorder_level,
        supplier_id: supplier_id || null,
        branch_id: branch_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/inventory");
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

    revalidatePath("/inventory");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
