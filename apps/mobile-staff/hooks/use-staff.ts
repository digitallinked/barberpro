import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type StaffMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  branch_id: string | null;
  staff_profile_id: string;
  employment_type: string;
  base_salary: number;
  joined_at: string | null;
};

export function useStaffMembers(tenantId: string, branchId?: string | null) {
  return useQuery({
    queryKey: ["staff-members", tenantId, branchId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("staff_profiles")
        .select(
          `id, employment_type, base_salary, joined_at,
           app_users!inner (id, full_name, email, phone, role, is_active, branch_id)`
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (branchId) {
        query = query.eq("app_users.branch_id", branchId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data ?? []).map((row: Record<string, unknown>) => {
        const appUser = Array.isArray(row.app_users) ? row.app_users[0] : row.app_users;
        const u = appUser as Record<string, unknown>;
        return {
          id: u?.id as string,
          full_name: u?.full_name as string,
          email: u?.email as string | null,
          phone: u?.phone as string | null,
          role: u?.role as string,
          is_active: u?.is_active as boolean,
          branch_id: u?.branch_id as string | null,
          staff_profile_id: row.id as string,
          employment_type: row.employment_type as string,
          base_salary: (row.base_salary as number) ?? 0,
          joined_at: row.joined_at as string | null,
        } satisfies StaffMember;
      });
    },
    enabled: !!tenantId,
  });
}
