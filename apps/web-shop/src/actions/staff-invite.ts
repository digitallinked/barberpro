"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@barberpro/db/admin";

import { getAuthContext } from "./_helpers";
import { env } from "@/lib/env";
import { isOwnerOrManager } from "@/lib/permissions";

export async function inviteStaffMember(formData: FormData) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can invite staff" };
    }

    const email = (formData.get("email") as string)?.trim();
    const fullName = (formData.get("full_name") as string)?.trim();
    const role = formData.get("role") as string;
    const branchId = formData.get("branch_id") as string;

    if (!email || !fullName || !role || !branchId) {
      return { success: false, error: "Email, name, role and branch are required" };
    }

    const validRoles = ["manager", "barber", "cashier"];
    if (!validRoles.includes(role)) {
      return { success: false, error: "Invalid role" };
    }

    // Verify branch belongs to this tenant
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .single();

    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    // Check if an app_user already exists with this email in this tenant
    const { data: existing } = await supabase
      .from("app_users")
      .select("id, is_active")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A staff member with this email already exists" };
    }

    // Create the app_users row (auth_user_id will be linked after invite acceptance)
    const { data: appUserRow, error: insertError } = await supabase
      .from("app_users")
      .insert({
        full_name: fullName,
        email,
        role,
        tenant_id: tenantId,
        branch_id: branchId,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) return { success: false, error: insertError.message };
    if (!appUserRow) return { success: false, error: "Failed to create staff record" };

    // Create staff_profiles row
    await supabase.from("staff_profiles").insert({
      tenant_id: tenantId,
      user_id: appUserRow.id,
      employment_type: "full_time",
      base_salary: 0,
    });

    // Send invite via Supabase Auth (requires service role)
    if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
      const adminClient = createAdminClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          tenant_id: tenantId,
          app_user_id: appUserRow.id,
          role,
        },
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      });

      if (inviteError) {
        // If invite fails, mark the record with null auth_user_id so it shows as "pending"
        console.error("Invite email failed:", inviteError.message);
      }
    }

    revalidatePath("/[branchSlug]/staff", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function revokeStaffAccess(staffAppUserId: string) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can revoke access" };
    }

    const { error } = await supabase
      .from("app_users")
      .update({ is_active: false })
      .eq("id", staffAppUserId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/staff", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function resendStaffInvite(staffAppUserId: string) {
  try {
    const { supabase, tenantId, appUser } = await getAuthContext();

    if (!isOwnerOrManager(appUser.role)) {
      return { success: false, error: "Only owners and managers can resend invites" };
    }

    const { data: staffUser } = await supabase
      .from("app_users")
      .select("email, full_name, role, auth_user_id")
      .eq("id", staffAppUserId)
      .eq("tenant_id", tenantId)
      .single();

    if (!staffUser?.email) {
      return { success: false, error: "Staff member not found" };
    }

    if (staffUser.auth_user_id) {
      return { success: false, error: "This staff member has already accepted the invite" };
    }

    if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
      const adminClient = createAdminClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        staffUser.email,
        {
          data: {
            full_name: staffUser.full_name,
            tenant_id: tenantId,
            app_user_id: staffAppUserId,
            role: staffUser.role,
          },
          redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      );

      if (inviteError) {
        return { success: false, error: inviteError.message };
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
