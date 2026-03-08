"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/types/database.types";
import { getAuthContext } from "./_helpers";

export async function createCommissionScheme(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const payout_model = formData.get("payout_model") as string;
    const base_salary = Number(formData.get("base_salary")) || 0;
    const per_customer_amount = Number(formData.get("per_customer_amount")) || 0;
    const per_service_amount = Number(formData.get("per_service_amount")) || 0;
    const percentage_rate = Number(formData.get("percentage_rate")) || 0;
    const product_commission_rate = Number(formData.get("product_commission_rate")) || 0;
    const target_bonus_rules = formData.get("target_bonus_rules");
    const deduction_rules = formData.get("deduction_rules");

    if (!name || !payout_model) {
      return { success: false, error: "Name and payout model are required" };
    }

    let targetBonus: Json = {};
    if (typeof target_bonus_rules === "string") {
      try {
        targetBonus = JSON.parse(target_bonus_rules) as Json;
      } catch {
        targetBonus = {};
      }
    }
    let deductionRules: Json = {};
    if (typeof deduction_rules === "string") {
      try {
        deductionRules = JSON.parse(deduction_rules) as Json;
      } catch {
        deductionRules = {};
      }
    }

    const { error } = await supabase.from("commission_schemes").insert({
      tenant_id: tenantId,
      name,
      payout_model,
      base_salary,
      per_customer_amount,
      per_service_amount,
      percentage_rate,
      product_commission_rate,
      target_bonus_rules: targetBonus,
      deduction_rules: deductionRules,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/commissions");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCommissionScheme(id: string, formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const name = formData.get("name") as string;
    const payout_model = formData.get("payout_model") as string;
    const base_salary = Number(formData.get("base_salary")) || 0;
    const per_customer_amount = Number(formData.get("per_customer_amount")) || 0;
    const per_service_amount = Number(formData.get("per_service_amount")) || 0;
    const percentage_rate = Number(formData.get("percentage_rate")) || 0;
    const product_commission_rate = Number(formData.get("product_commission_rate")) || 0;
    const target_bonus_rules = formData.get("target_bonus_rules");
    const deduction_rules = formData.get("deduction_rules");

    if (!name || !payout_model) {
      return { success: false, error: "Name and payout model are required" };
    }

    const updateData: Record<string, unknown> = {
      name,
      payout_model,
      base_salary,
      per_customer_amount,
      per_service_amount,
      percentage_rate,
      product_commission_rate,
      updated_at: new Date().toISOString(),
    };

    if (target_bonus_rules !== undefined && target_bonus_rules !== null) {
      updateData.target_bonus_rules =
        typeof target_bonus_rules === "string"
          ? JSON.parse(target_bonus_rules)
          : target_bonus_rules;
    }
    if (deduction_rules !== undefined && deduction_rules !== null) {
      updateData.deduction_rules =
        typeof deduction_rules === "string" ? JSON.parse(deduction_rules) : deduction_rules;
    }

    const { error } = await supabase
      .from("commission_schemes")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/commissions");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function assignCommissionScheme(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const scheme_id = formData.get("scheme_id") as string;
    const staff_id = formData.get("staff_id") as string;
    const effective_from = formData.get("effective_from") as string;
    const effective_to = (formData.get("effective_to") as string) || null;

    if (!scheme_id || !staff_id || !effective_from) {
      return { success: false, error: "Scheme, staff, and effective from date are required" };
    }

    const { error } = await supabase.from("staff_commission_assignments").insert({
      tenant_id: tenantId,
      scheme_id,
      staff_id,
      effective_from,
      effective_to: effective_to || null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/commissions");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
