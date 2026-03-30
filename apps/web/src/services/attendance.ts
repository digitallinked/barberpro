import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type AttendanceRow = Tables<"staff_attendance">;

export type AttendanceWithStaff = AttendanceRow & {
  staff: { full_name: string } | null;
};

export type AttendanceSummary = {
  staffId: string;
  staffName: string;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysLeave: number;
  daysHalfDay: number;
  totalRecords: number;
};

export async function getStaffAttendance(
  client: Client,
  tenantId: string,
  dateFrom: string,
  dateTo: string,
  staffId?: string
): Promise<{ data: AttendanceWithStaff[] | null; error: Error | null }> {
  let query = client
    .from("staff_attendance")
    .select(
      `
      id, tenant_id, staff_id, branch_id, date, clock_in, clock_out,
      status, notes, created_at, updated_at,
      staff_profiles!staff_attendance_staff_id_fkey (app_users!inner (full_name))
    `
    )
    .eq("tenant_id", tenantId)
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: false });

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: new Error(error.message) };

  const records: AttendanceWithStaff[] = (data ?? []).map((row: Record<string, unknown>) => {
    const staffProfile = row.staff_profiles as Record<string, unknown> | null;
    const appUser = staffProfile?.app_users as Record<string, unknown> | Record<string, unknown>[] | null;
    const staffData = Array.isArray(appUser) ? appUser[0] : appUser;

    return {
      id: row.id as string,
      tenant_id: row.tenant_id as string,
      staff_id: row.staff_id as string,
      branch_id: row.branch_id as string | null,
      date: row.date as string,
      clock_in: row.clock_in as string | null,
      clock_out: row.clock_out as string | null,
      status: row.status as string,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      staff: staffData
        ? { full_name: (staffData as Record<string, unknown>).full_name as string }
        : null,
    };
  });

  return { data: records, error: null };
}

export async function getAttendanceSummaries(
  client: Client,
  tenantId: string,
  dateFrom: string,
  dateTo: string
): Promise<{ data: AttendanceSummary[] | null; error: Error | null }> {
  const { data, error } = await getStaffAttendance(client, tenantId, dateFrom, dateTo);
  if (error || !data) return { data: null, error };

  const byStaff = new Map<string, { name: string; records: typeof data }>();

  for (const record of data) {
    const existing = byStaff.get(record.staff_id);
    if (existing) {
      existing.records.push(record);
    } else {
      byStaff.set(record.staff_id, {
        name: record.staff?.full_name ?? "Unknown",
        records: [record],
      });
    }
  }

  const summaries: AttendanceSummary[] = [];
  for (const [staffId, { name, records }] of byStaff) {
    summaries.push({
      staffId,
      staffName: name,
      daysPresent: records.filter((r) => r.status === "present").length,
      daysAbsent: records.filter((r) => r.status === "absent").length,
      daysLate: records.filter((r) => r.status === "late").length,
      daysLeave: records.filter((r) => r.status === "leave").length,
      daysHalfDay: records.filter((r) => r.status === "half_day").length,
      totalRecords: records.length,
    });
  }

  return { data: summaries, error: null };
}
