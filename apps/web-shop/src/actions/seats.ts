"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "./_helpers";
import { resolveEffectiveBranchId } from "@/lib/supabase/branch-resolution";

export type BranchSeat = {
  id: string;
  seat_number: number;
  label: string;
  staff_profile_id: string | null;
  is_active: boolean;
  barber_name: string | null;
};

export async function getSeats(requestedBranchId?: string | null): Promise<{
  success: boolean;
  data?: BranchSeat[];
  error?: string;
}> {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();
    const branchId = await resolveEffectiveBranchId(
      supabase,
      tenantId,
      appUser.branch_id ?? null,
      requestedBranchId ?? null
    );
    if (!branchId) return { success: false, error: "No active branch found" };

    const { data, error } = await supabase
      .from("branch_seats")
      .select("id, seat_number, label, staff_profile_id, is_active, staff_profiles (app_users (full_name))")
      .eq("tenant_id", tenantId)
      .eq("branch_id", branchId)
      .order("seat_number", { ascending: true });

    if (error) return { success: false, error: error.message };

    const seats: BranchSeat[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const sp = r.staff_profiles as Record<string, unknown> | null;
      const au = sp?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
      const appUser = Array.isArray(au) ? au[0] : au;
      return {
        id: row.id,
        seat_number: row.seat_number,
        label: row.label,
        staff_profile_id: row.staff_profile_id,
        is_active: row.is_active,
        barber_name: (appUser?.full_name as string) ?? null,
      };
    });

    return { success: true, data: seats };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function upsertSeat(params: {
  id?: string;
  branchId: string;
  seatNumber: number;
  label: string;
  staffProfileId?: string | null;
  isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const payload = {
      tenant_id: tenantId,
      branch_id: params.branchId,
      seat_number: params.seatNumber,
      label: params.label || `Seat ${params.seatNumber}`,
      staff_profile_id: params.staffProfileId ?? null,
      is_active: params.isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    if (params.id) {
      const { error } = await supabase
        .from("branch_seats")
        .update(payload)
        .eq("id", params.id)
        .eq("tenant_id", tenantId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("branch_seats")
        .insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteSeat(seatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();
    const { error } = await supabase
      .from("branch_seats")
      .delete()
      .eq("id", seatId)
      .eq("tenant_id", tenantId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function assignBarberToSeat(
  seatId: string,
  staffProfileId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, tenantId } = await getAuthContext();
    const { error } = await supabase
      .from("branch_seats")
      .update({ staff_profile_id: staffProfileId, updated_at: new Date().toISOString() })
      .eq("id", seatId)
      .eq("tenant_id", tenantId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/queue");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
