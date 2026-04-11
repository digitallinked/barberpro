"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  User,
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
  useBranchHref,
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { isOwnerOrManager } from "@/lib/permissions";
import { AttendanceCalendarGrid } from "@/components/attendance-calendar";
import type { StaffMember } from "@/services/staff";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
      <Icon className="h-4 w-4 text-[#D4AF37]" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-white text-right">{value ?? "—"}</span>
    </div>
  );
}

function getInitials(fullName: string): string {
  return fullName.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatRole(role: string): string {
  const map: Record<string, string> = {
    barber: "Barber", cashier: "Cashier", manager: "Manager",
    staff: "Staff", senior_barber: "Senior Barber", junior_barber: "Junior Barber",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(t: string): string {
  const map: Record<string, string> = { full_time: "Full Time", part_time: "Part Time", contract: "Contract" };
  return map[t] ?? t.replace(/_/g, " ");
}

function formatMaritalStatus(s: string | null): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    single: "Single / Divorced / Widowed",
    married_spouse_no_income: "Married (Spouse Not Working)",
    married_spouse_income: "Married (Spouse Working)",
    divorced: "Divorced",
    widowed: "Widowed",
  };
  return map[s] ?? s;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-MY", { month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
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

// ─── Edit modal form sections ──────────────────────────────────────────────────

const MALAYSIAN_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Sabah",
  "Sarawak", "Selangor", "Terengganu", "W.P. Kuala Lumpur",
  "W.P. Labuan", "W.P. Putrajaya",
];

const MALAYSIAN_BANKS = [
  "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank",
  "AmBank", "Bank Islam", "Bank Rakyat", "Bank Muamalat", "Affin Bank",
  "Alliance Bank", "OCBC Bank", "Standard Chartered", "HSBC Bank",
  "UOB Bank", "BSN (Bank Simpanan Nasional)", "Agrobank", "Other",
];

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FormField({
  label, name, type = "text", defaultValue, placeholder, children, required,
}: {
  label: string; name: string; type?: string; defaultValue?: string | number | null;
  placeholder?: string; children?: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children ?? (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] placeholder:text-gray-600"
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { userRole } = useTenant();
  const canManage = isOwnerOrManager(userRole);
  const bHref = useBranchHref();

  const [isPending, startTransition] = useTransition();
  const [clockFeedback, setClockFeedback] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editTab, setEditTab] = useState<"basic" | "personal" | "statutory" | "banking">("basic");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
        <Link href={bHref("/staff")} className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white">
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
  const workedDaysCount = monthRecords.filter((r) => ["present", "late", "half_day"].includes(r.status)).length;
  const onTimePct = workedDaysCount > 0 ? Math.round(((workedDaysCount - lateCount) / workedDaysCount) * 100) : null;
  const daysWorkedDisplay = attendanceMonthSummary != null
    ? `${attendanceMonthSummary.daysWorked} / ${attendanceMonthSummary.totalWorkingDays}` : "—";
  const totalCommission = commissionCalc != null
    ? commissionCalc.serviceCommission + commissionCalc.productCommission : null;
  const todayRecord = todayAttendanceResult?.data?.[0];
  const canClockIn = staff.is_active && (!todayRecord || !todayRecord.clock_in);
  const canClockOut = !!(todayRecord?.clock_in && !todayRecord.clock_out);

  // Build full address string for display
  const addressParts = [
    staff.address_line1, staff.address_line2,
    staff.postcode && staff.city ? `${staff.postcode} ${staff.city}` : staff.city || staff.postcode,
    staff.state,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ") || null;

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
    // Persist hidden epf/socso enabled values
    fd.set("epf_enabled", (e.currentTarget.querySelector("[name=epf_enabled]") as HTMLInputElement)?.checked ? "true" : "false");
    fd.set("socso_enabled", (e.currentTarget.querySelector("[name=socso_enabled]") as HTMLInputElement)?.checked ? "true" : "false");
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

  const stats = [
    { label: "Customers served", value: commissionCalc != null ? String(commissionCalc.customersServed) : "—", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Service revenue", value: commissionCalc != null ? formatRM(commissionCalc.serviceRevenue) : "—", icon: CircleDollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Commission earned", value: totalCommission != null ? formatRM(totalCommission) : "—", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Days worked (month)", value: daysWorkedDisplay, icon: CalendarCheck2, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  ];

  const editTabs = [
    { key: "basic", label: "Basic Info" },
    { key: "personal", label: "Personal" },
    { key: "statutory", label: "Statutory" },
    { key: "banking", label: "Banking" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={bHref("/staff")} className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {actionFeedback && (
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">{actionFeedback}</span>
            )}
            <button type="button" disabled={actionPending} onClick={handleResendInvite}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50">
              <Mail className="h-3.5 w-3.5" /> Resend Invite
            </button>
            {staff.is_active ? (
              <button type="button" disabled={actionPending} onClick={() => setShowConfirm("deactivate")}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                <ShieldOff className="h-3.5 w-3.5" /> Deactivate
              </button>
            ) : (
              <button type="button" disabled={actionPending} onClick={() => setShowConfirm("reactivate")}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
              </button>
            )}
            <button type="button" onClick={() => { setShowEdit(true); setEditError(null); setEditTab("basic"); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Profile hero */}
      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 text-2xl font-bold text-[#D4AF37]">
            {getInitials(staff.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{staff.full_name}</h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  {formatRole(staff.role)} · <span className="text-gray-500">{branchName}</span>
                </p>
              </div>
              <span className={`ml-auto mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${staff.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-gray-500/30 bg-gray-500/10 text-gray-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${staff.is_active ? "bg-emerald-400" : "bg-gray-500"}`} />
                {staff.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {staff.email && <span className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3.5 w-3.5 text-gray-600" />{staff.email}</span>}
              {staff.phone && <span className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3.5 w-3.5 text-gray-600" />{staff.phone}</span>}
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><CalendarCheck2 className="h-3.5 w-3.5 text-gray-600" />Joined {formatMonthYear(staff.joined_at ?? staff.created_at)}</span>
              {staff.employee_code && <span className="flex items-center gap-1.5 text-xs text-gray-500"><BadgeCheck className="h-3.5 w-3.5 text-gray-600" />{staff.employee_code}</span>}
              {staff.nric_number && <span className="flex items-center gap-1.5 text-xs text-gray-500"><FileText className="h-3.5 w-3.5 text-gray-600" />IC: {staff.nric_number}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 border-t border-white/5 px-5 py-3 sm:px-6">
          <div><p className="text-[10px] uppercase tracking-wider text-gray-600">Employment</p><p className="mt-0.5 text-sm font-medium text-white">{formatEmploymentType(staff.employment_type)}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-gray-600">Base salary</p><p className="mt-0.5 text-sm font-medium text-white">{staff.base_salary > 0 ? `RM ${staff.base_salary.toLocaleString("en-MY")}` : "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-gray-600">EPF No.</p><p className="mt-0.5 text-sm font-medium text-white">{staff.epf_number ?? "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-gray-600">SOCSO No.</p><p className="mt-0.5 text-sm font-medium text-white">{staff.socso_number ?? "—"}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-gray-600">Bank</p><p className="mt-0.5 text-sm font-medium text-white">{staff.bank_name ?? "—"}</p></div>
          {staff.bank_account_number && <div><p className="text-[10px] uppercase tracking-wider text-gray-600">Account No.</p><p className="mt-0.5 text-sm font-medium text-white">{staff.bank_account_number}</p></div>}
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
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          {/* Attendance calendar */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Attendance — {new Date(monthRange.start).toLocaleDateString("en-MY", { month: "long", year: "numeric" })}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{workedDaysCount} days worked · {lateCount} late · {absentCount} absent · {leaveCount} leave</p>
              </div>
              {onTimePct != null && (
                <span className={`text-lg font-bold ${onTimePct >= 90 ? "text-emerald-400" : onTimePct >= 70 ? "text-[#D4AF37]" : "text-red-400"}`}>
                  {onTimePct}%<span className="ml-1 text-[10px] font-normal text-gray-600">on-time</span>
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
              <span className="text-xs text-gray-500">{commissionCalc?.schemeName ? `Scheme: ${commissionCalc.schemeName}` : "No active scheme"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#111] p-3">
                <p className="text-[10px] text-gray-500">Service commission</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">{commissionCalc ? formatRM(commissionCalc.serviceCommission) : "—"}</p>
                {commissionCalc && <p className="mt-0.5 text-[10px] text-gray-600">from {formatRM(commissionCalc.serviceRevenue)} revenue</p>}
              </div>
              <div className="rounded-lg bg-[#111] p-3">
                <p className="text-[10px] text-gray-500">Product commission</p>
                <p className="mt-1 text-lg font-bold text-[#D4AF37]">{commissionCalc ? formatRM(commissionCalc.productCommission) : "—"}</p>
                {commissionCalc && <p className="mt-0.5 text-[10px] text-gray-600">from {formatRM(commissionCalc.productRevenue)} sales</p>}
              </div>
              <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <p className="text-[10px] text-gray-500">Total earned</p>
                <p className="mt-1 text-lg font-bold text-[#D4AF37]">{totalCommission != null ? formatRM(totalCommission) : "—"}</p>
                <p className="mt-0.5 text-[10px] text-gray-600">this month</p>
              </div>
            </div>
          </Card>

          {/* Personal & statutory info cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personal */}
            <Card className="overflow-hidden">
              <SectionHeader icon={User} title="Personal Details" />
              <div className="divide-y divide-white/[0.04] px-4">
                <InfoRow label="NRIC / IC No." value={staff.nric_number} />
                <InfoRow label="Date of Birth" value={formatDate(staff.date_of_birth)} />
                <InfoRow label="Gender" value={staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : null} />
                <InfoRow label="Nationality" value={staff.nationality} />
                <InfoRow label="Marital Status" value={formatMaritalStatus(staff.marital_status)} />
                <InfoRow label="No. of Dependents" value={staff.num_dependents ?? "—"} />
              </div>
            </Card>

            {/* Address */}
            <Card className="overflow-hidden">
              <SectionHeader icon={MapPin} title="Residential Address" />
              <div className="px-4 py-3">
                {fullAddress ? (
                  <p className="text-sm text-gray-300 leading-relaxed">{fullAddress.split(", ").join("\n")}</p>
                ) : (
                  <p className="text-sm text-gray-600">No address recorded</p>
                )}
              </div>
            </Card>

            {/* Statutory */}
            <Card className="overflow-hidden">
              <SectionHeader icon={ShieldCheck} title="Statutory Registration" />
              <div className="divide-y divide-white/[0.04] px-4">
                <InfoRow label="EPF / KWSP No." value={staff.epf_number} />
                <InfoRow label="EPF Applicable" value={staff.epf_enabled ? "Yes" : "No"} />
                <InfoRow label="SOCSO No." value={staff.socso_number} />
                <InfoRow label="SOCSO Applicable" value={staff.socso_enabled ? "Yes" : "No"} />
                <InfoRow label="EIS / SIP No." value={staff.eis_number} />
                <InfoRow label="Income Tax Ref." value={staff.tax_ref_number} />
              </div>
            </Card>

            {/* Emergency contact */}
            <Card className="overflow-hidden">
              <SectionHeader icon={Phone} title="Emergency Contact" />
              <div className="divide-y divide-white/[0.04] px-4">
                <InfoRow label="Name" value={staff.emergency_contact_name} />
                <InfoRow label="Phone" value={staff.emergency_contact_phone} />
              </div>
            </Card>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Today */}
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
            {clockFeedback && <p className="mb-2 text-xs text-red-400">{clockFeedback}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={!canClockIn || isPending} onClick={handleClockIn}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />} Clock In
              </button>
              <button type="button" disabled={!canClockOut || isPending} onClick={handleClockOut}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">
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

          {/* Payroll */}
          <Card className="overflow-hidden">
            <SectionHeader icon={Banknote} title="Payroll" />
            <div className="divide-y divide-white/[0.04] px-4">
              <InfoRow label="Base salary" value={staff.base_salary > 0 ? `RM ${staff.base_salary.toLocaleString("en-MY")}` : "—"} />
              <InfoRow label="Employment type" value={formatEmploymentType(staff.employment_type)} />
              <InfoRow label="Bank" value={staff.bank_name} />
              <InfoRow label="Account no." value={staff.bank_account_number} />
            </div>
            <div className="px-4 pb-3 pt-2">
              <Link href={bHref("/payroll")}
                className="block w-full rounded-lg border border-white/10 py-2 text-center text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white">
                View Payroll →
              </Link>
            </div>
          </Card>

          {/* Notes */}
          {staff.notes && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</h3>
              <p className="text-sm leading-relaxed text-gray-400">{staff.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <p className="mt-0.5 text-sm text-gray-400">{staff.full_name}</p>
              </div>
              <button type="button" onClick={() => setShowEdit(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-white/5">
              {editTabs.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setEditTab(tab.key)}
                  className={`flex-1 py-2.5 text-xs font-medium transition ${editTab === tab.key ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-gray-500 hover:text-gray-300"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleEditSubmit}>
              {editError && (
                <div className="mx-6 mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{editError}</div>
              )}

              <div className="space-y-5 p-6">
                {/* ── BASIC TAB ── */}
                {editTab === "basic" && (
                  <>
                    <FormSection title="Contact Information">
                      <FormField label="Full Name" name="full_name" defaultValue={staff.full_name} required />
                      <FormRow>
                        <FormField label="Email" name="email" type="email" defaultValue={staff.email} />
                        <FormField label="Phone" name="phone" defaultValue={staff.phone} placeholder="01X-XXXXXXXX" />
                      </FormRow>
                    </FormSection>

                    <FormSection title="Employment">
                      <FormRow>
                        <FormField label="Role" name="role" required>
                          <select name="role" defaultValue={staff.role} required
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                            <option value="manager">Manager</option>
                            <option value="barber">Barber</option>
                            <option value="senior_barber">Senior Barber</option>
                            <option value="junior_barber">Junior Barber</option>
                            <option value="cashier">Cashier</option>
                            <option value="staff">Staff</option>
                          </select>
                        </FormField>
                        <FormField label="Branch" name="branch_id">
                          <select name="branch_id" defaultValue={staff.branch_id ?? ""}
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                            <option value="">— No branch —</option>
                            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </FormField>
                      </FormRow>
                      <FormRow>
                        <FormField label="Employment Type" name="employment_type">
                          <select name="employment_type" defaultValue={staff.employment_type}
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="contract">Contract</option>
                          </select>
                        </FormField>
                        <FormField label="Base Salary (RM)" name="base_salary" type="number" defaultValue={staff.base_salary} />
                      </FormRow>
                      <FormRow>
                        <FormField label="Employee Code" name="employee_code" defaultValue={staff.employee_code} placeholder="e.g. BP001" />
                        <FormField label="Join Date" name="joined_at" type="date" defaultValue={staff.joined_at ?? ""} />
                      </FormRow>
                    </FormSection>

                    <FormSection title="Notes">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-400">Internal Notes</label>
                        <textarea name="notes" rows={3} defaultValue={staff.notes ?? ""}
                          placeholder="Any notes about this staff member…"
                          className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] placeholder:text-gray-600" />
                      </div>
                    </FormSection>
                  </>
                )}

                {/* ── PERSONAL TAB ── */}
                {editTab === "personal" && (
                  <>
                    <FormSection title="Identity">
                      <FormRow>
                        <FormField label="NRIC / IC Number" name="nric_number" defaultValue={staff.nric_number} placeholder="XXXXXX-XX-XXXX" />
                        <FormField label="Date of Birth" name="date_of_birth" type="date" defaultValue={staff.date_of_birth ?? ""} />
                      </FormRow>
                      <FormRow>
                        <FormField label="Gender" name="gender">
                          <select name="gender" defaultValue={staff.gender ?? ""}
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                            <option value="">— Select —</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </FormField>
                        <FormField label="Nationality" name="nationality" defaultValue={staff.nationality ?? "Malaysian"} />
                      </FormRow>
                    </FormSection>

                    <FormSection title="Tax & PCB Profile">
                      <FormRow>
                        <FormField label="Marital Status" name="marital_status">
                          <select name="marital_status" defaultValue={staff.marital_status ?? ""}
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                            <option value="">— Select —</option>
                            <option value="single">Single / Divorced / Widowed</option>
                            <option value="married_spouse_no_income">Married (Spouse Not Working)</option>
                            <option value="married_spouse_income">Married (Spouse Working)</option>
                          </select>
                        </FormField>
                        <FormField label="No. of Dependents" name="num_dependents" type="number" defaultValue={staff.num_dependents ?? 0} />
                      </FormRow>
                      <p className="text-[10px] text-gray-600">Marital status and dependents are used to calculate PCB / MTD estimates on payslips.</p>
                    </FormSection>

                    <FormSection title="Residential Address">
                      <FormField label="Address Line 1" name="address_line1" defaultValue={staff.address_line1} placeholder="No. & Street name" />
                      <FormField label="Address Line 2" name="address_line2" defaultValue={staff.address_line2} placeholder="Apartment, suite, etc. (optional)" />
                      <FormRow>
                        <FormField label="Postcode" name="postcode" defaultValue={staff.postcode} placeholder="XXXXX" />
                        <FormField label="City" name="city" defaultValue={staff.city} placeholder="Kuala Lumpur" />
                      </FormRow>
                      <FormField label="State" name="state">
                        <select name="state" defaultValue={staff.state ?? ""}
                          className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                          <option value="">— Select state —</option>
                          {MALAYSIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </FormField>
                    </FormSection>

                    <FormSection title="Emergency Contact">
                      <FormRow>
                        <FormField label="Contact Name" name="emergency_contact_name" defaultValue={staff.emergency_contact_name} />
                        <FormField label="Contact Phone" name="emergency_contact_phone" defaultValue={staff.emergency_contact_phone} placeholder="01X-XXXXXXXX" />
                      </FormRow>
                    </FormSection>
                  </>
                )}

                {/* ── STATUTORY TAB ── */}
                {editTab === "statutory" && (
                  <>
                    <FormSection title="EPF / KWSP">
                      <FormRow>
                        <FormField label="EPF Member Number" name="epf_number" defaultValue={staff.epf_number} placeholder="e.g. 70909999" />
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">EPF Applicable</label>
                          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#111] px-3 py-2.5">
                            <input type="checkbox" name="epf_enabled" defaultChecked={staff.epf_enabled}
                              className="h-4 w-4 rounded accent-[#D4AF37]" />
                            <span className="text-sm text-white">Apply EPF deductions</span>
                          </label>
                        </div>
                      </FormRow>
                    </FormSection>

                    <FormSection title="SOCSO / PERKESO">
                      <FormRow>
                        <FormField label="SOCSO Number" name="socso_number" defaultValue={staff.socso_number} placeholder="e.g. 70909999" />
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400">SOCSO Applicable</label>
                          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#111] px-3 py-2.5">
                            <input type="checkbox" name="socso_enabled" defaultChecked={staff.socso_enabled}
                              className="h-4 w-4 rounded accent-[#D4AF37]" />
                            <span className="text-sm text-white">Apply SOCSO deductions</span>
                          </label>
                        </div>
                      </FormRow>
                    </FormSection>

                    <FormSection title="EIS / SIP & Income Tax">
                      <FormRow>
                        <FormField label="EIS / SIP Number" name="eis_number" defaultValue={staff.eis_number} placeholder="Usually same as SOCSO" />
                        <FormField label="Income Tax Ref. (LHDN)" name="tax_ref_number" defaultValue={staff.tax_ref_number} placeholder="e.g. SG XXXXXXXXXX" />
                      </FormRow>
                    </FormSection>

                    <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 text-[11px] text-gray-400 leading-relaxed">
                      Statutory numbers are used only for display on payslips and for your own records. BarberPro does not submit any data to KWSP, PERKESO, or LHDN on your behalf.
                    </div>
                  </>
                )}

                {/* ── BANKING TAB ── */}
                {editTab === "banking" && (
                  <FormSection title="Bank Account for Salary Payment">
                    <FormField label="Bank Name" name="bank_name">
                      <select name="bank_name" defaultValue={staff.bank_name ?? ""}
                        className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                        <option value="">— Select bank —</option>
                        {MALAYSIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Account Number" name="bank_account_number" defaultValue={staff.bank_account_number} placeholder="e.g. 1234567890" />
                    <div className="rounded-lg border border-white/5 bg-[#111] p-3 text-[11px] text-gray-600 leading-relaxed">
                      Bank account details are stored securely and shown on payslips only. Ensure these match the employee&apos;s official bank records for accurate salary transfers.
                    </div>
                  </FormSection>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 border-t border-white/5 px-6 py-4">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={editPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50">
                  {editPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm deactivate / reactivate */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${showConfirm === "deactivate" ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              {showConfirm === "deactivate" ? <ShieldOff className="h-7 w-7 text-red-400" /> : <CheckCircle2 className="h-7 w-7 text-emerald-400" />}
            </div>
            <h3 className="text-lg font-bold text-white">{showConfirm === "deactivate" ? "Deactivate" : "Reactivate"} {staff.full_name}?</h3>
            <p className="mt-2 text-sm text-gray-400">
              {showConfirm === "deactivate"
                ? "This staff member will lose access to the dashboard. You can reactivate them at any time."
                : "This will restore their dashboard access and mark them as active."}
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5">
                Cancel
              </button>
              <button type="button" disabled={actionPending}
                onClick={showConfirm === "deactivate" ? handleDeactivate : handleReactivate}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${showConfirm === "deactivate" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}`}>
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
