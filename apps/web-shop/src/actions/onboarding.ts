"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { createClient } from "@/lib/supabase/server";

export async function saveOwnerDetails(data: {
  phone: string;
  language: "ms" | "en";
}) {
  try {
    const { supabase, tenantId, appUserId } = await getAuthContext();

    await supabase
      .from("tenants")
      .update({
        preferred_language: data.language,
        ...(data.phone ? { phone: data.phone } : {}),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", tenantId);

    if (data.phone) {
      await supabase
        .from("app_users")
        .update({ phone: data.phone, updated_at: new Date().toISOString() })
        .eq("id", appUserId);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function saveOperatingHours(data: {
  days: string[];
  openTime: string;
  closeTime: string;
}) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const allDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const operatingHours: Record<string, { open: string; close: string } | null> = {};
    for (const day of allDays) {
      operatingHours[day] = data.days.includes(day)
        ? { open: data.openTime, close: data.closeTime }
        : null;
    }

    const { error } = await supabase
      .from("branches")
      .update({ operating_hours: operatingHours, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("is_hq", true);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createFirstService(data: {
  name: string;
  price: number;
  duration_min: number;
}) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    // Reuse existing active category or create a default one
    const { data: existingCat } = await supabase
      .from("service_categories")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    let categoryId = existingCat?.id ?? null;

    if (!categoryId) {
      const { data: newCat } = await supabase
        .from("service_categories")
        .insert({ tenant_id: tenantId, name: "General", is_active: true })
        .select("id")
        .single();
      categoryId = newCat?.id ?? null;
    }

    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name: data.name,
      price: data.price,
      duration_min: data.duration_min,
      category_id: categoryId,
      is_active: true,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function completeSetupWizard() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("tenants")
      .update({ setup_wizard_completed: true } as Record<string, unknown>)
      .eq("owner_auth_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Called on mount of /onboarding page to check if wizard was already done. */
export async function getSetupWizardStatus(): Promise<{ completed: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { completed: true };

    const { data } = await supabase
      .from("tenants")
      .select("setup_wizard_completed")
      .eq("owner_auth_id", user.id)
      .maybeSingle();

    const row = data as Record<string, unknown> | null;
    return { completed: row?.setup_wizard_completed === true };
  } catch {
    return { completed: true };
  }
}
