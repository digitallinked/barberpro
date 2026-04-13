import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { enqueueMutation } from "../lib/offline-queue";

export type CartItem = {
  serviceId: string | null;
  inventoryItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  itemType: "service" | "product";
};

export type PaymentMethod = "cash" | "qr" | "card";

export type TransactionResult =
  | { success: true; txnId: string; savedOffline: false }
  | { success: true; txnId: null; savedOffline: true };

export function usePosTransaction(tenantId: string, branchId: string, appUserId: string) {
  const queryClient = useQueryClient();

  const submitTransaction = useMutation({
    mutationFn: async ({
      cart,
      paymentMethod,
      customerId,
      discountAmount,
    }: {
      cart: CartItem[];
      paymentMethod: PaymentMethod;
      customerId?: string | null;
      discountAmount?: number;
    }): Promise<TransactionResult> => {
      if (cart.length === 0) throw new Error("Cart is empty");

      const subtotal = cart.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const discount = discountAmount ?? 0;
      const totalAmount = Math.max(0, subtotal - discount);

      const { data: txn, error: txnError } = await supabase
        .from("transactions")
        .insert({
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: customerId ?? null,
          payment_method: paymentMethod,
          payment_status: "paid",
          subtotal,
          tax_amount: 0,
          discount_amount: discount,
          total_amount: totalAmount,
          paid_at: new Date().toISOString(),
          created_by: appUserId,
        })
        .select("id")
        .single();

      if (txnError || !txn) throw new Error(txnError?.message ?? "Failed to create transaction");

      const items = cart.map((item) => ({
        transaction_id: txn.id,
        tenant_id: tenantId,
        name: item.name,
        item_type: item.itemType,
        service_id: item.serviceId ?? null,
        inventory_item_id: item.inventoryItemId ?? null,
        staff_id: appUserId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("transaction_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      return { success: true, txnId: txn.id, savedOffline: false };
    },
    onError: (_err, variables) => {
      enqueueMutation({
        type: "pos_transaction",
        payload: {
          cart: variables.cart,
          paymentMethod: variables.paymentMethod,
          customerId: variables.customerId,
          discountAmount: variables.discountAmount,
          tenantId,
          branchId,
          appUserId,
        },
      });
    },
    onSuccess: (result) => {
      if (!result.savedOffline) {
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    },
  });

  /**
   * Submits the transaction. On network failure, queues it for later sync
   * and returns a result indicating it was saved offline.
   */
  async function submitWithOfflineFallback(variables: {
    cart: CartItem[];
    paymentMethod: PaymentMethod;
    customerId?: string | null;
    discountAmount?: number;
  }): Promise<TransactionResult> {
    try {
      return await submitTransaction.mutateAsync(variables);
    } catch {
      return { success: true, txnId: null, savedOffline: true };
    }
  }

  return { submitTransaction, submitWithOfflineFallback };
}
