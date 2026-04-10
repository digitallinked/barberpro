"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  Mail,
  Pencil,
  Phone,
  ShieldOff,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { clockIn, clockOut } from "@/actions/attendance";
import { updateStaffMember, deleteStaffMember, reactivateStaffMember } from "@/actions/staff";
import { resendStaffInvite } from "@/actions/staff-invite";
import {
  useStaffMember,
  useBranches,
  useStaffCommission,
  useStaffAttendanceSummary,
  useStaffAttendance,
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { isOwnerOrManager } from "@/lib/permissions";
import { AttendanceCalendarGrid } from "@/components/attendance-calendar";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    barber: "Barber",
    cashier: "Cashier",
    manager: "Manager",
    staff: "Staff",
    senior_barber: "Senior Barber",
    junior_barber: "Junior Barber",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(t: string): string {
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
  };
  return map[t] ?? t.replace(/_/g, " ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { userRole } = useTenant();
  const canManage = isOwnerOrManager(userRole);

  const [isPending, startTransition] = useTransition();
  const [clockFeedback, setClockFeedback] = useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Action state
  const [actionPending, setActionPending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<"deactivate" | "reactivate" | null>(null);

  const monthRange = useMemo(() => currentMonthRange(), []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: staffResult, isLoading } = useStaffMember(id);
  const { data: branchesData } = useBranches();

  const { data: commissionCalc } = useStaffCommission(id, monthRange.start, monthRange.end);
  const { data: attendanceMonthSummary } = useStaffAttendanceSummary(id, monthRange.start, monthRange.end);
  const { data: monthAttendanceResult } = useStaffAttendance(monthRange.start, monthRange.end, id);
  const { data: todayAttendanceResult } = useStaffAttendance(todayStr, todayStr, id);

  const staff = staffResult?.data ?? null;
  const branches = branchesData?.data ?? [];
  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const branchName = staff?.branch_id ? (branchMap[staff.branch_id] ?? "—") : "—";

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="text-sm text-gray-500">Loading profile…</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="space-y-6">
        <Link href="/staff" className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
          Staff member not found
        </div>
      </div>
    );
  }

  const profileId = staff.staff_profile_id;
  const monthRecords = monthAttendanceResult?.data ?? [];
  const lateCount = monthRecords.filter((r) => r.status === "late").length;
  const leaveCount = monthRecords.filter((r) => r.status === "leave").length;
  const absentCount = monthRecords.filter((r) => r.status === "absent").length;
  const workedDaysCount = monthRecords.filter((r) =>
    ["present", "late", "half_day"].includes(r.status)
  ).length;
  const onTimePct =
    workedDaysCount > 0 ? Math.round(((workedDaysCount - lateCount) / workedDaysCount) * 100) : null;

  const daysWorkedDisplay =
    attendanceMonthSummary != null
      ? `${attendanceMonthSummary.daysWorked} / ${attendanceMonthSummary.totalWorkingDays}`
      : "—";

  const totalCommission =
    commissionCalc != null ? commissionCalc.serviceCommission + commissionCalc.productCommission : null;

  const todayRecord = todayAttendanceResult?.data?.[0];
  const canClockIn = staff.is_active && (!todayRecord || !todayRecord.clock_in);
  const canClockOut = !!(todayRecord?.clock_in && !todayRecord.clock_out);

  const invalidateAttendance = () => {
    void queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-attendance-summary"] });
  };

  const handleClockIn = () => {
    setClockFeedback(null);
    startTransition(async () => {
      const r = await clockIn(profileId, staff.branch_id ?? undefined);
      if (!r.success) setClockFeedback(r.error ?? "Clock in failed");
      else invalidateAttendance();
    });
  };

  const handleClockOut = () => {
    setClockFeedback(null);
    startTransition(async () => {
      const r = await clockOut(profileId);
      if (!r.success) setClockFeedback(r.error ?? "Clock out failed");
      else invalidateAttendance();
    });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditPending(true);
    setEditError(null);
    const fd = new FormData(e.currentTarget);
    const result = await updateStaffMember(staff.id, fd);
    setEditPending(false);
    if (result.success) {
      setShowEdit(false);
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-member", id] });
    } else {
      setEditError(result.error ?? "Failed to update");
    }
  };

  const handleDeactivate = async () => {
    setActionPending(true);
    setActionFeedback(null);
    const result = await deleteStaffMember(staff.id);
    setActionPending(false);
    setShowConfirm(null);
    if (result.success) {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-member", id] });
    } else {
      setActionFeedback(result.error ?? "Failed to deactivate");
    }
  };

  const handleReactivate = async () => {
    setActionPending(true);
    setActionFeedback(null);
    const result = await reactivateStaffMember(staff.id);
    setActionPending(false);
    setShowConfirm(null);
    if (result.success) {
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-member", id] });
    } else {
      setActionFeedback(result.error ?? "Failed to reactivate");
    }
  };

  const handleResendInvite = async () => {
    setActionPending(true);
    await resendStaffInvite(staff.id);
    setActionPending(false);
    setActionFeedback("Invite resent successfully");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Stat cards data
  const stats = [
    {
      label: "Customers served",
      value: commissionCalc != null ? String(commissionCalc.customersServed) : "—",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Service revenue",
      value: commissionCalc != null ? formatRM(commissionCalc.serviceRevenue) : "—",
      icon: CircleDollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Commission earned",
      value: totalCommission != null ? formatRM(totalCommission) : "—",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Days worked (month)",
      value: daysWorkedDisplay,
      icon: CalendarCheck2,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top navigation bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {actionFeedback && (
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                {actionFeedback}
              </span>
            )}
            <button
              type="button"
              disabled={actionPending}
              onClick={handleResendInvite}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" /> Resend Invite
            </button>
            {staff.is_active ? (
              <button
                type="button"
                disabled={actionPending}
                onClick={() => setShowConfirm("deactivate")}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <ShieldOff className="h-3.5 w-3.5" /> Deactivate
              </button>
            ) : (
              <button
                type="button"
                disabled={actionPending}
                onClick={() => setShowConfirm("reactivate")}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowEdit(true); setEditError(null); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Profile hero card */}
      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 text-2xl font-bold text-[#D4AF37]">
            {getInitials(staff.full_name)}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{staff.full_name}</h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  {formatRole(staff.role)}
                  {" · "}
                  <span className="text-gray-500">{branchName}</span>
                </p>
              </div>
              <span
                className={`ml-auto mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  staff.is_active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${staff.is_active ? "bg-emerald-400" : "bg-gray-500"}`} />
                {staff.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Contact & meta info */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {staff.email && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5 text-gray-600" />
                  {staff.email}
                </span>
              )}
              {staff.phone && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5 text-gray-600" />
                  {staff.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarCheck2 className="h-3.5 w-3.5 text-gray-600" />
                Joined {formatDate(staff.joined_at ?? staff.created_at)}
              </span>
              {staff.employee_code && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <BadgeCheck className="h-3.5 w-3.5 text-gray-600" />
                  {staff.employee_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Employment strip */}
        <div className="flex flex-wrap gap-6 border-t border-white/5 px-5 py-3 sm:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Employment</p>
            <p className="mt-0.5 text-sm font-medium text-white">{formatEmploymentType(staff.employment_type)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Base salary</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {staff.base_salary > 0 ? `RM ${staff.base_salary.toLocaleString("en-MY")}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Branch</p>
            <p className="mt-0.5 text-sm font-medium text-white">{branchName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Role</p>
            <p className="mt-0.5 text-sm font-medium text-white">{formatRole(staff.role)}</p>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{s.label}</p>
                  <p className={`mt-1.5 text-xl font-bold sm:text-2xl ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-gray-600">this month</p>
                </div>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Attendance calendar */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Attendance — {new Date(monthRange.start).toLocaleDateString("en-MY", { month: "long", year: "numeric" })}</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {workedDaysCount} days worked · {lateCount} late · {absentCount} absent · {leaveCount} leave
                </p>
              </div>
              {onTimePct != null && (
                <span className={`text-lg font-bold ${onTimePct >= 90 ? "text-emerald-400" : onTimePct >= 70 ? "text-[#D4AF37]" : "text-red-400"}`}>
                  {onTimePct}%
                  <span className="ml-1 text-[10px] font-normal text-gray-600">on-time</span>
                </span>
              )}
            </div>
            <AttendanceCalendarGrid
              attendanceRows={monthRecords}
              staffList={staff ? [{ ...staff }] : []}
              dateFrom={monthRange.start}
              dateTo={monthRange.end}
              onCellClick={() => {}}
            />
          </Card>

          {/* Commission breakdown */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Commission breakdown</h3>
              <span className="text-xs text-gray-500">
                {commissionCalc?.schemeName
                  ? `Scheme: ${commissionCalc.schemeName}`
                  : "No active scheme"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#111] p-3">
                <p className="text-[10px] text-gray-500">Service commission</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {commissionCalc ? formatRM(commissionCalc.serviceCommission) : "—"}
                </p>
                {commissionCalc && (
                  <p className="mt-0.5 text-[10px] text-gray-600">from {formatRM(commissionCalc.serviceRevenue)} revenue</p>
                )}
              </div>
              <div className="rounded-lg bg-[#111] p-3">
                <p className="text-[10px] text-gray-500">Product commission</p>
                <p className="mt-1 text-lg font-bold text-[#D4AF37]">
                  {commissionCalc ? formatRM(commissionCalc.productCommission) : "—"}
                </p>
                {commissionCalc && (
                  <p className="mt-0.5 text-[10px] text-gray-600">from {formatRM(commissionCalc.productRevenue)} sales</p>
                )}
              </div>
              <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <p className="text-[10px] text-gray-500">Total earned</p>
                <p className="mt-1 text-lg font-bold text-[#D4AF37]">
                  {totalCommission != null ? formatRM(totalCommission) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-600">this month</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Today's attendance + clock */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Today</h3>
            <div className="mb-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-[#111] p-2">
                <p className="text-[10px] text-gray-600">Clock in</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{formatTime(todayRecord?.clock_in ?? null)}</p>
              </div>
              <div className="rounded-lg bg-[#111] p-2">
                <p className="text-[10px] text-gray-600">Clock out</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{formatTime(todayRecord?.clock_out ?? null)}</p>
              </div>
            </div>
            {clockFeedback && (
              <p className="mb-2 text-xs text-red-400">{clockFeedback}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canClockIn || isPending}
                onClick={handleClockIn}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                Clock In
              </button>
              <button
                type="button"
                disabled={!canClockOut || isPending}
                onClick={handleClockOut}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clock Out
              </button>
            </div>
          </Card>

          {/* Attendance summary */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Monthly attendance</h3>
            <div className="space-y-2">
              {[
                { label: "Days worked", value: daysWorkedDisplay, color: "text-emerald-400" },
                { label: "Late arrivals", value: monthAttendanceResult?.data ? String(lateCount) : "—", color: "text-amber-400" },
                { label: "Absent", value: monthAttendanceResult?.data ? String(absentCount) : "—", color: "text-red-400" },
                { label: "On leave", value: monthAttendanceResult?.data ? String(leaveCount) : "—", color: "text-purple-400" },
                { label: "On-time rate", value: onTimePct != null ? `${onTimePct}%` : "—", color: onTimePct != null && onTimePct >= 90 ? "text-emerald-400" : "text-[#D4AF37]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payroll info */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Payroll</h3>
            <div className="space-y-2">
              {[
                { label: "Base salary", value: staff.base_salary > 0 ? `RM ${staff.base_salary.toLocaleString("en-MY")}` : "—", color: "text-white" },
                { label: "Employment type", value: formatEmploymentType(staff.employment_type), color: "text-emerald-400" },
                { label: "EPF (employee)", value: "—", color: "text-gray-400" },
                { label: "SOCSO", value: "—", color: "text-gray-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-medium ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/payroll"
              className="mt-3 block w-full rounded-lg border border-white/10 py-2 text-center text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              View Payroll →
            </Link>
          </Card>
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <p className="mt-1 text-sm text-gray-400">{staff.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              {editError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{editError}</div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Full Name <span className="text-red-400">*</span></label>
                <input
                  name="full_name"
                  required
                  defaultValue={staff.full_name}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={staff.email ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Phone</label>
                  <input
                    name="phone"
                    defaultValue={staff.phone ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Role <span className="text-red-400">*</span></label>
                  <select
                    name="role"
                    required
                    defaultValue={staff.role}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="manager">Manager</option>
                    <option value="barber">Barber</option>
                    <option value="senior_barber">Senior Barber</option>
                    <option value="junior_barber">Junior Barber</option>
                    <option value="cashier">Cashier</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch</label>
                  <select
                    name="branch_id"
                    defaultValue={staff.branch_id ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">— No branch —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Employment Type</label>
                  <select
                    name="employment_type"
                    defaultValue={staff.employment_type}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Base Salary (RM)</label>
                  <input
                    name="base_salary"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={staff.base_salary}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
                >
                  {editPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm deactivate / reactivate ─────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                showConfirm === "deactivate" ? "bg-red-500/10" : "bg-emerald-500/10"
              }`}
            >
              {showConfirm === "deactivate" ? (
                <ShieldOff className="h-7 w-7 text-red-400" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white">
              {showConfirm === "deactivate" ? "Deactivate" : "Reactivate"} {staff.full_name}?
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {showConfirm === "deactivate"
                ? "This staff member will lose access to the dashboard. You can reactivate them at any time."
                : "This will restore their dashboard access and mark them as active."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={showConfirm === "deactivate" ? handleDeactivate : handleReactivate}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${
                  showConfirm === "deactivate"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {actionPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {showConfirm === "deactivate" ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
