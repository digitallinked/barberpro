import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type InventoryItemRow = Tables<"inventory_items">;
type InventoryMovementRow = Tables<"inventory_movements">;
type SupplierRow = Tables<"suppliers">;

export async function getInventoryItems(
  client: Client,
  tenantId: string,
  branchId?: string | null,
): Promise<{ data: InventoryItemRow[] | null; error: Error | null }> {
  let query = client
    .from("inventory_items")
    .select("id, name, sku, item_type, stock_qty, reorder_level, unit_cost, sell_price, is_active, branch_id, supplier_id, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;
  return { data, error: error ? new Error(error.message) : null };
}

export async function getInventoryStats(
  client: Client,
  tenantId: string,
  branchId?: string | null,
): Promise<{
  data: { totalItems: number; lowStock: number } | null;
  error: Error | null;
}> {
  let countQuery = client
    .from("inventory_items")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  let itemsQuery = client
    .from("inventory_items")
    .select("id, stock_qty, reorder_level")
    .eq("tenant_id", tenantId);

  if (branchId) {
    countQuery = countQuery.eq("branch_id", branchId);
    itemsQuery = itemsQuery.eq("branch_id", branchId);
  }

  const { count: totalItems, error: totalError } = await countQuery;

  if (totalError) {
    return { data: null, error: new Error(totalError.message) };
  }

  const { data: items, error: itemsError } = await itemsQuery;

  if (itemsError) {
    return { data: null, error: new Error(itemsError.message) };
  }

  const lowStock = (items ?? []).filter(
    (i) => (i.stock_qty ?? 0) <= (i.reorder_level ?? 0),
  ).length;

  return {
    data: {
      totalItems: totalItems ?? 0,
      lowStock,
    },
    error: null,
  };
}

export async function getSuppliers(
  client: Client,
  tenantId: string
): Promise<{ data: SupplierRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("suppliers")
    .select("id, name, contact_name, phone, email, tenant_id, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getInventoryMovements(
  client: Client,
  itemId: string
): Promise<{ data: InventoryMovementRow[] | null; error: Error | null }> {
  const { data, error } = await client
    .from("inventory_movements")
    .select("id, inventory_item_id, movement_type, quantity, reason, reference_id, reference_type, branch_id, created_by, tenant_id, created_at")
    .eq("inventory_item_id", itemId)
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}
