import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Promotion = {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_spend: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export function usePromotions(tenantId: string) {
  return useQuery({
    queryKey: ["promotions", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select(
          "id, name, description, discount_type, discount_value, min_spend, start_date, end_date, is_active, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as Promotion[];
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
