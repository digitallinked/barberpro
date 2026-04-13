import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type Service = {
  id: string;
  name: string;
  category_id: string | null;
  duration_min: number;
  price: number;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
};

export function useServices(tenantId: string) {
  return useQuery({
    queryKey: ["services", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category_id, duration_min, price, is_active, tenant_id, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return data as Service[];
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useServiceActions(tenantId: string) {
  const queryClient = useQueryClient();

  const updateService = useMutation({
    mutationFn: async ({
      id,
      name,
      price,
      duration_min,
      is_active,
    }: {
      id: string;
      name?: string;
      price?: number;
      duration_min?: number;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from("services")
        .update({ name, price, duration_min, is_active })
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", tenantId] });
    },
  });

  return { updateService };
}
