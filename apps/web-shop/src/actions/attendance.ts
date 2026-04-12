"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "./_helpers";
import { attendanceSchema, bulkAttendanceRecordSchema } from "@/validations/schemas";
import { formDataToObject } from "@/lib/form-utils";
import { z } from "zod";

export async function recordAttendance(formData: FormData) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const parsed = attendanceSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { staff_id, date, status, clock_in, clock_out, branch_id, notes } = parsed.data;

    const { error } = await supabase.from("staff_attendance").upsert(
      {
        tenant_id: tenantId,
        staff_id,
        date,
        status,
        clock_in,
        clock_out,
        branch_id,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,staff_id,date" }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    revalidatePath("/[branchSlug]/staff", "page");
    revalidatePath("/[branchSlug]/staff/[id]", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function clockIn(staffId: string, branchId?: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toISOString();

    const { error } = await supabase.from("staff_attendance").upsert(
      {
        tenant_id: tenantId,
        staff_id: staffId,
        date: dateStr,
        clock_in: timeStr,
        status: "present",
        branch_id: branchId || null,
        updated_at: timeStr,
      },
      { onConflict: "tenant_id,staff_id,date" }
    );

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    revalidatePath("/[branchSlug]/staff", "page");
    revalidatePath("/[branchSlug]/staff/[id]", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function clockOut(staffId: string) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toISOString();

    const { data: existing } = await supabase
      .from("staff_attendance")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("staff_id", staffId)
      .eq("date", dateStr)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: "No clock-in record found for today" };
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update({
        clock_out: timeStr,
        updated_at: timeStr,
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    revalidatePath("/[branchSlug]/staff", "page");
    revalidatePath("/[branchSlug]/staff/[id]", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function bulkRecordAttendance(
  records: Array<{ staff_id: string; date: string; status: string; branch_id?: string }>
) {
  try {
    const { supabase, tenantId } = await getAuthContext();

    const validated = z.array(bulkAttendanceRecordSchema).safeParse(records);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const rows = validated.data.map((r) => ({
      tenant_id: tenantId,
      staff_id: r.staff_id,
      date: r.date,
      status: r.status,
      branch_id: r.branch_id ?? null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("staff_attendance")
      .upsert(rows, { onConflict: "tenant_id,staff_id,date" });

    if (error) return { success: false, error: error.message };

    revalidatePath("/[branchSlug]/payroll", "page");
    revalidatePath("/[branchSlug]/staff", "page");
    for (const r of records) {
      revalidatePath(`/staff/${r.staff_id}`);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
