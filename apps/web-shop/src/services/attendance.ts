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
  // Fetch both the SQL rollup (for counts) and the full records (for staff names) in parallel
  const [rpcResult, fullResult] = await Promise.all([
    client.rpc("report_attendance_summary", {
      p_tenant_id: tenantId,
      p_date_from: dateFrom,
      p_date_to: dateTo,
    }),
    getStaffAttendance(client, tenantId, dateFrom, dateTo),
  ]);

  if (rpcResult.error) {
    return { data: null, error: new Error(rpcResult.error.message) };
  }
  if (fullResult.error || !fullResult.data) {
    return { data: null, error: fullResult.error };
  }

  // Build a name map from the full attendance records
  const nameMap = new Map<string, string>();
  for (const record of fullResult.data) {
    if (!nameMap.has(record.staff_id) && record.staff?.full_name) {
      nameMap.set(record.staff_id, record.staff.full_name);
    }
  }

  // Build total record counts per staff
  const totalMap = new Map<string, number>();
  for (const record of fullResult.data) {
    totalMap.set(record.staff_id, (totalMap.get(record.staff_id) ?? 0) + 1);
  }

  const summaries: AttendanceSummary[] = (rpcResult.data ?? []).map((row) => ({
    staffId: row.staff_id as string,
    staffName: nameMap.get(row.staff_id as string) ?? "Unknown",
    daysPresent: Number(row.present ?? 0),
    daysAbsent: Number(row.absent ?? 0),
    daysLate: Number(row.late ?? 0),
    daysLeave: 0,
    daysHalfDay: Number(row.half_day ?? 0),
    totalRecords: totalMap.get(row.staff_id as string) ?? 0,
  }));

  return { data: summaries, error: null };
}
