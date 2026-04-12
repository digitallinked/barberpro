"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import {
  commissionSchemeSchema,
  commissionAssignmentSchema,
} from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";

export async function createCommissionScheme(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = commissionSchemeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      name,
      payout_model,
      base_salary,
      per_customer_amount,
      per_service_amount,
      percentage_rate,
      product_commission_rate,
      target_bonus_rules,
      deduction_rules,
    } = parsed.data;

    const { error } = await supabase.from("commission_schemes").insert({
      tenant_id: tenantId,
      name,
      payout_model,
      base_salary,
      per_customer_amount,
      per_service_amount,
      percentage_rate,
      product_commission_rate,
      target_bonus_rules,
      deduction_rules,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/commissions", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCommissionScheme(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = commissionSchemeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      name,
      payout_model,
      base_salary,
      per_customer_amount,
      per_service_amount,
      percentage_rate,
      product_commission_rate,
      target_bonus_rules,
      deduction_rules,
    } = parsed.data;

    const { error } = await supabase
      .from("commission_schemes")
      .update({
        name,
        payout_model,
        base_salary,
        per_customer_amount,
        per_service_amount,
        percentage_rate,
        product_commission_rate,
        target_bonus_rules,
        deduction_rules,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/commissions", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function assignCommissionScheme(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = commissionAssignmentSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { scheme_id, staff_id, effective_from, effective_to } = parsed.data;

    const { error } = await supabase.from("staff_commission_assignments").insert({
      tenant_id: tenantId,
      scheme_id,
      staff_id,
      effective_from,
      effective_to: effective_to ?? null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/commissions", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
