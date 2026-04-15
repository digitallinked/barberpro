"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { getAuthContext } from "./_helpers";
import { isOwnerOrManager } from "@/lib/permissions";
import { staffMemberSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createStaffMember(formData: FormData) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can add staff" };
    }

    const parsed = staffMemberSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      full_name, email, phone, role, branch_id,
      employment_type, base_salary, employee_code, joined_at,
      nric_number, date_of_birth, gender, nationality, marital_status, num_dependents,
      address_line1, address_line2, city, state, postcode,
      epf_number, epf_enabled, socso_number, socso_enabled, eis_number, tax_ref_number,
      bank_name, bank_account_number, emergency_contact_name, emergency_contact_phone,
      notes,
    } = parsed.data;

    const { data: newUser, error: newUserError } = await supabase
      .from("app_users")
      .insert({
        full_name,
        email,
        phone,
        role,
        tenant_id: tenantId,
        branch_id,
        is_active: true,
      })
      .select("id")
      .single();

    if (newUserError) return { success: false, error: newUserError.message };
    if (!newUser) return { success: false, error: "Failed to create staff user" };

    const profileFields = {
      employment_type, base_salary, employee_code, joined_at,
      nric_number, date_of_birth, gender, nationality, marital_status, num_dependents,
      address_line1, address_line2, city, state, postcode,
      epf_number, epf_enabled, socso_number, socso_enabled, eis_number, tax_ref_number,
      bank_name, bank_account_number, emergency_contact_name, emergency_contact_phone,
      notes,
    };

    const { error: profileError } = await supabase.from("staff_profiles").insert({
      tenant_id: tenantId,
      user_id: newUser.id,
      ...profileFields,
    });

    if (profileError) return { success: false, error: profileError.message };

    revalidatePath("/[branchSlug]/staff", "page");
    revalidateTag("staff");
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

    const parsed = staffMemberSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      full_name, email, phone, role, branch_id,
      employment_type, base_salary, employee_code, joined_at,
      nric_number, date_of_birth, gender, nationality, marital_status, num_dependents,
      address_line1, address_line2, city, state, postcode,
      epf_number, epf_enabled, socso_number, socso_enabled, eis_number, tax_ref_number,
      bank_name, bank_account_number, emergency_contact_name, emergency_contact_phone,
      notes,
    } = parsed.data;

    const { error: appUserError } = await supabase
      .from("app_users")
      .update({
        full_name,
        email,
        phone,
        role,
        branch_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (appUserError) return { success: false, error: appUserError.message };

    const profileFields = {
      employment_type, base_salary, employee_code, joined_at,
      nric_number, date_of_birth, gender, nationality, marital_status, num_dependents,
      address_line1, address_line2, city, state, postcode,
      epf_number, epf_enabled, socso_number, socso_enabled, eis_number, tax_ref_number,
      bank_name, bank_account_number, emergency_contact_name, emergency_contact_phone,
      notes,
    };

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

    revalidatePath("/[branchSlug]/staff", "page");
    revalidatePath("/[branchSlug]/staff/[id]", "page");
    revalidateTag("staff");
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

    revalidatePath("/[branchSlug]/staff", "page");
    revalidateTag("staff");
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

    revalidatePath("/[branchSlug]/staff", "page");
    revalidateTag("staff");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
