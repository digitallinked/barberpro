"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { isOwnerOrManager } from "@/lib/permissions";

export async function createStaffMember(formData: FormData) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can add staff" };
    }

    const full_name = formData.get("full_name") as string;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    const role = formData.get("role") as string;
    const branch_id = (formData.get("branch_id") as string) || null;
    const employment_type = (formData.get("employment_type") as string) || "full_time";
    const base_salary = Number(formData.get("base_salary")) || 0;
    const employee_code = (formData.get("employee_code") as string) || null;

    if (!full_name || !role) {
      return { success: false, error: "Full name and role are required" };
    }

    const { data: newUser, error: newUserError } = await supabase
      .from("app_users")
      .insert({
        full_name,
        email: email || null,
        phone: phone || null,
        role,
        tenant_id: tenantId,
        branch_id: branch_id || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (newUserError) return { success: false, error: newUserError.message };
    if (!newUser) return { success: false, error: "Failed to create staff user" };

    const { error: profileError } = await supabase.from("staff_profiles").insert({
      tenant_id: tenantId,
      user_id: newUser.id,
      employment_type,
      base_salary,
      employee_code: employee_code || null,
    });

    if (profileError) return { success: false, error: profileError.message };

    revalidatePath("/staff");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateStaffMember(id: string, formData: FormData) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can edit staff" };
    }

    const full_name = formData.get("full_name") as string;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    const role = formData.get("role") as string;
    const branch_id = (formData.get("branch_id") as string) || null;
    const employment_type = (formData.get("employment_type") as string) || "full_time";
    const base_salary = Number(formData.get("base_salary")) || 0;
    const employee_code = (formData.get("employee_code") as string) || null;

    if (!full_name || !role) {
      return { success: false, error: "Full name and role are required" };
    }

    const { error: appUserError } = await supabase
      .from("app_users")
      .update({
        full_name,
        email: email || null,
        phone: phone || null,
        role,
        branch_id: branch_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (appUserError) return { success: false, error: appUserError.message };

    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("user_id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (profile) {
      const { error: profileError } = await supabase
        .from("staff_profiles")
        .update({
          employment_type,
          base_salary,
          employee_code: employee_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .eq("tenant_id", tenantId);

      if (profileError) return { success: false, error: profileError.message };
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reactivateStaffMember(id: string) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can reactivate staff" };
    }

    const { error } = await supabase
      .from("app_users")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/staff");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteStaffMember(id: string) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can deactivate staff" };
    }

    const { error } = await supabase
      .from("app_users")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/staff");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
