import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  item_type: string;
  stock_qty: number;
  reorder_level: number | null;
  unit_cost: number | null;
  sell_price: number | null;
  is_active: boolean;
  branch_id: string | null;
  tenant_id: string;
};

export function useInventory(tenantId: string, branchId?: string | null) {
  return useQuery({
    queryKey: ["inventory", tenantId, branchId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select(
          "id, name, sku, item_type, stock_qty, reorder_level, unit_cost, sell_price, is_active, branch_id, tenant_id"
        )
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });

      if (branchId) query = query.eq("branch_id", branchId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as InventoryItem[];
    },
    enabled: !!tenantId,
  });
}

export function useInventoryActions(tenantId: string, branchId: string, appUserId: string) {
  const queryClient = useQueryClient();

  const adjustStock = useMutation({
    mutationFn: async ({
      itemId,
      qty,
      reason,
      movementType,
    }: {
      itemId: string;
      qty: number;
      reason: string;
      movementType: "restock" | "usage" | "adjustment";
    }) => {
      const { data: item, error: fetchError } = await supabase
        .from("inventory_items")
        .select("stock_qty")
        .eq("id", itemId)
        .single();

      if (fetchError || !item) throw new Error("Item not found");

      const newQty =
        movementType === "usage"
          ? (item.stock_qty ?? 0) - qty
          : (item.stock_qty ?? 0) + qty;

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ stock_qty: newQty })
        .eq("id", itemId)
        .eq("tenant_id", tenantId);

      if (updateError) throw new Error(updateError.message);

      await supabase.from("inventory_movements").insert({
        tenant_id: tenantId,
        branch_id: branchId,
        inventory_item_id: itemId,
        movement_type: movementType,
        quantity: movementType === "usage" ? -qty : qty,
        reason,
        created_by: appUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
    },
  });

  return { adjustStock };
}
