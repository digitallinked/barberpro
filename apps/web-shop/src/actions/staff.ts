"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { isOwnerOrManager } from "@/lib/permissions";

function getProfileFields(formData: FormData) {
  return {
    employment_type: (formData.get("employment_type") as string) || "full_time",
    base_salary: Number(formData.get("base_salary")) || 0,
    employee_code: (formData.get("employee_code") as string) || null,
    joined_at: (formData.get("joined_at") as string) || null,
    // Personal
    nric_number: (formData.get("nric_number") as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    gender: (formData.get("gender") as string) || null,
    nationality: (formData.get("nationality") as string) || null,
    marital_status: (formData.get("marital_status") as string) || null,
    num_dependents: formData.get("num_dependents") !== null && formData.get("num_dependents") !== ""
      ? Number(formData.get("num_dependents"))
      : null,
    // Address
    address_line1: (formData.get("address_line1") as string) || null,
    address_line2: (formData.get("address_line2") as string) || null,
    city: (formData.get("city") as string) || null,
    state: (formData.get("state") as string) || null,
    postcode: (formData.get("postcode") as string) || null,
    // Statutory
    epf_number: (formData.get("epf_number") as string) || null,
    epf_enabled: formData.get("epf_enabled") === "true",
    socso_number: (formData.get("socso_number") as string) || null,
    socso_enabled: formData.get("socso_enabled") === "true",
    eis_number: (formData.get("eis_number") as string) || null,
    tax_ref_number: (formData.get("tax_ref_number") as string) || null,
    // Banking
    bank_name: (formData.get("bank_name") as string) || null,
    bank_account_number: (formData.get("bank_account_number") as string) || null,
    // Emergency contact
    emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
    emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
    // Notes
    notes: (formData.get("notes") as string) || null,
  };
}

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

    const profileFields = getProfileFields(formData);

    const { error: profileError } = await supabase.from("staff_profiles").insert({
      tenant_id: tenantId,
      user_id: newUser.id,
      ...profileFields,
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

    const profileFields = getProfileFields(formData);

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
          ...profileFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .eq("tenant_id", tenantId);

      if (profileError) return { success: false, error: profileError.message };
    }

    revalidatePath("/staff");
    revalidatePath(`/staff/${id}`);
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
