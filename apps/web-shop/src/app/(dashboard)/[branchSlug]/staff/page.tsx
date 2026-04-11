"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useStaffMembers, useBranches, useStaffAttendance } from "@/hooks";
import type { StaffMember } from "@/services/staff";
import { createStaffMember } from "@/actions/staff";
import { inviteStaffMember } from "@/actions/staff-invite";
import { recordAttendance } from "@/actions/attendance";
import { useT } from "@/lib/i18n/language-context";
import { useTenant } from "@/components/tenant-provider";
import { useMaybeBranchContext } from "@/components/branch-context";
import { isOwnerOrManager } from "@/lib/permissions";
import { AttendanceCalendarGrid } from "@/components/attendance-calendar";

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

function calendarMonthBounds(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}


const STARTER_STAFF_LIMIT = 5;

export default function StaffPage() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenantPlan, userRole } = useTenant();
  const activeBranch = useMaybeBranchContext();
  const activeBranchId = activeBranch?.id ?? null;
  const activeBranchName = activeBranch?.name ?? null;
  const isAllBranches = activeBranch === null;
  const { data: staffResult, isLoading: staffLoading } = useStaffMembers();
  const { data: branchesResult } = useBranches();

  const initialRange = useMemo(() => calendarMonthBounds(), []);
  const [attFrom, setAttFrom] = useState(initialRange.from);
  const [attTo, setAttTo] = useState(initialRange.to);
  const [attStaffId, setAttStaffId] = useState("");
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState("present");
  const [attPending, setAttPending] = useState(false);
  const [attBanner, setAttBanner] = useState<string | null>(null);
  const [attSelectedName, setAttSelectedName] = useState<string | null>(null);
  const attFormRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, setPending] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);


  const { data: attendanceWrap, isFetching: attLoading } = useStaffAttendance(attFrom, attTo);
  const attendanceRows = attendanceWrap?.data ?? [];

  const staffList = staffResult?.data ?? [];

  // Filter attendance to only staff in the active branch (staffList is already branch-scoped)
  const staffIdSet = useMemo(() => new Set(staffList.map((s) => s.staff_profile_id)), [staffList]);
  const branchFilteredAttendance = useMemo(
    () => attendanceRows.filter((r) => staffIdSet.has(r.staff_id)),
    [attendanceRows, staffIdSet]
  );
  const isStarter = tenantPlan === "starter";
  const atStaffLimit = isStarter && staffList.length >= STARTER_STAFF_LIMIT;
  const branches = branchesResult?.data ?? [];
  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));

  const filteredStaff = staffList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q) ||
      formatRole(s.role).toLowerCase().includes(q)
    );
  });

  const activeCount = staffList.filter((s) => s.is_active).length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createStaffMember(fd);
    setPending(false);
    if (result.success) {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    }
  }

  async function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError(null);
    setInvitePending(true);
    const fd = new FormData(e.currentTarget);
    const result = await inviteStaffMember(fd);
    setInvitePending(false);
    if (result.success) {
      setInviteSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } else {
      setInviteError(result.error ?? "Failed to send invite");
    }
  }

  async function handleAttendanceSave(e: React.FormEvent) {
    e.preventDefault();
    if (!attStaffId || !attDate) return;
    setAttPending(true);
    setAttBanner(null);
    const fd = new FormData();
    fd.set("staff_id", attStaffId);
    fd.set("date", attDate);
    fd.set("status", attStatus);
    if (activeBranchId) fd.set("branch_id", activeBranchId);
    const result = await recordAttendance(fd);
    setAttPending(false);
    if (result.success) {
      void queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-attendance-summary"] });
      setAttBanner(null);
    } else {
      setAttBanner(result.error ?? "Failed to save");
    }
  }

  function handleCellClick(staffId: string, staffName: string, date: string, currentStatus?: string) {
    setAttStaffId(staffId);
    setAttDate(date);
    setAttStatus(currentStatus ?? "present");
    setAttSelectedName(staffName);
    setAttBanner(null);
    setTimeout(() => {
      attFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  function shiftMonth(delta: number) {
    const d = new Date(attFrom + "T00:00:00");
    d.setMonth(d.getMonth() + delta);
    const y = d.getFullYear();
    const m = d.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    setAttFrom(from);
    setAttTo(to);
  }


  const attMonthLabel = useMemo(() => {
    const d = new Date(attFrom + "T00:00:00");
    return d.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  }, [attFrom]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{t.staff.title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{t.staff.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={t.staff.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/40 sm:w-52"
            />
          </div>
          {isOwnerOrManager(userRole) && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10 sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              Invite Staff
            </button>
          )}
          <button
            type="button"
            onClick={() => atStaffLimit ? setShowUpgrade(true) : setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 sm:w-auto"
          >
            {atStaffLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {t.staff.addStaff}
          </button>
        </div>
      </div>

      {/* Starter plan staff-limit banner */}
      {isStarter && (
        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
          <p className="min-w-0 text-sm leading-relaxed text-gray-300">
            <span className="font-semibold text-white">Starter plan</span> — includes up to {STARTER_STAFF_LIMIT} staff members ({staffList.length}/{STARTER_STAFF_LIMIT} used).{" "}
            {atStaffLimit && (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="font-semibold text-[#D4AF37] hover:underline"
              >
                Upgrade to Professional
              </button>
            )}{atStaffLimit ? " for unlimited staff." : ""}
          </p>
        </div>
      )}

      {/* Attendance — calendar grid view */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{t.staff.attendanceTitle}</h3>
                  {!isAllBranches && activeBranchName && (
                    <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                      {activeBranchName}
                    </span>
                  )}
                  {isAllBranches && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                      All Branches
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{t.staff.attendanceSubtitle}</p>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                ‹ Prev
              </button>
              <span className="min-w-[120px] text-center text-sm font-medium text-white">{attMonthLabel}</span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Next ›
              </button>
              <button
                type="button"
                onClick={() => { const r = calendarMonthBounds(); setAttFrom(r.from); setAttTo(r.to); }}
                className="rounded-lg border border-[#D4AF37]/30 px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
              >
                Today
              </button>
            </div>
          </div>

          {/* Custom date range (collapsed by default, shown as small inputs) */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-600">Custom range:</span>
            <input
              type="date"
              value={attFrom}
              onChange={(e) => setAttFrom(e.target.value)}
              className="rounded border border-white/10 bg-[#111] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]/40"
            />
            <span className="text-gray-600">→</span>
            <input
              type="date"
              value={attTo}
              onChange={(e) => setAttTo(e.target.value)}
              className="rounded border border-white/10 bg-[#111] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]/40"
            />
            {attLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            )}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="max-h-[520px] overflow-y-auto">
          {attLoading && branchFilteredAttendance.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : (
            <AttendanceCalendarGrid
              attendanceRows={branchFilteredAttendance}
              staffList={staffList.filter((s) => s.is_active)}
              dateFrom={attFrom}
              dateTo={attTo}
              selectedStaffId={attStaffId}
              selectedDate={attDate}
              onCellClick={handleCellClick}
            />
          )}
        </div>

        {/* Quick record form */}
        <div ref={attFormRef} className="border-t border-white/5">
          {attSelectedName && attStaffId && (
            <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 bg-[#D4AF37]/5 px-4 py-2 sm:px-5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#D4AF37]">Logging for</span>
              <span className="text-sm font-semibold text-white">{attSelectedName}</span>
              <span className="text-gray-600">·</span>
              <span className="text-sm text-gray-400">{attDate}</span>
              <button
                type="button"
                onClick={() => { setAttStaffId(""); setAttSelectedName(null); }}
                className="ml-auto text-gray-600 hover:text-gray-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <form
            onSubmit={handleAttendanceSave}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:px-5"
          >
            <div className="w-full min-w-0 sm:min-w-[160px] sm:flex-1">
              <label className="mb-1 block text-[10px] font-medium text-gray-500">{t.staff.colStaff}</label>
              <select
                value={attStaffId}
                onChange={(e) => {
                  setAttStaffId(e.target.value);
                  const found = staffList.find((s) => s.staff_profile_id === e.target.value);
                  setAttSelectedName(found?.full_name ?? null);
                }}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              >
                <option value="">{t.staff.selectStaff}</option>
                {staffList.map((s) => (
                  <option key={s.staff_profile_id} value={s.staff_profile_id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-[10px] font-medium text-gray-500">{t.staff.dateLabel}</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              />
            </div>
            <div className="w-full sm:min-w-[130px] sm:w-auto">
              <label className="mb-1 block text-[10px] font-medium text-gray-500">{t.staff.statusLabel}</label>
              <select
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              >
                <option value="present">{t.staff.present}</option>
                <option value="late">{t.staff.late}</option>
                <option value="half_day">{t.staff.halfDay}</option>
                <option value="absent">{t.staff.absent}</option>
                <option value="leave">{t.staff.leave}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={attPending || !attStaffId}
              className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2"
            >
              {attPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
                  Saving…
                </span>
              ) : (
                t.staff.saveAttendance
              )}
            </button>
          </form>
          {attBanner && (
            <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400 sm:px-5">
              {attBanner}
            </div>
          )}
        </div>
      </Card>

      {/* Staff table */}
      <Card className="overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              <span className="font-bold text-white">{staffLoading ? "…" : activeCount}</span> active
              <span className="mx-1.5 text-gray-700">·</span>
              <span className="font-bold text-white">{staffLoading ? "…" : staffList.length}</span> total
            </span>
          </div>
          {search && (
            <span className="text-xs text-gray-500">
              {filteredStaff.length} result{filteredStaff.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {staffLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14">
              <Users className="h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">
                {search ? `No staff match "${search}"` : "No staff yet — click Add Staff to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#141414] text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Staff member</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Employment</th>
                  <th className="px-4 py-3 text-right">Base salary</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredStaff.map((s) => {
                  const branchName = s.branch_id ? (branchMap[s.branch_id] ?? "—") : "—";
                  const employmentLabel =
                    { full_time: "Full Time", part_time: "Part Time", contract: "Contract" }[
                      s.employment_type
                    ] ?? s.employment_type.replace(/_/g, " ");

                  return (
                    <tr
                      key={s.staff_profile_id}
                      onClick={() => router.push(`/staff/${s.staff_profile_id}`)}
                      className="group cursor-pointer transition-colors hover:bg-[#D4AF37]/[0.04]"
                    >
                      {/* Staff name + role + contact */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#2a2a2a] text-xs font-bold text-white">
                            {getInitials(s.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{s.full_name}</p>
                            <p className="text-xs text-gray-500">{formatRole(s.role)}</p>
                            {(s.email ?? s.phone) && (
                              <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-gray-600">
                                {s.email ?? s.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5 text-gray-400">
                        {s.branch_id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]/50" />
                            {branchName}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>

                      {/* Employment type */}
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-400">
                          {employmentLabel}
                        </span>
                      </td>

                      {/* Base salary */}
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {s.base_salary > 0 ? (
                          <span className="text-gray-300">
                            RM{" "}
                            {s.base_salary.toLocaleString("en-MY", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            s.is_active
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-gray-500/30 bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? "bg-emerald-400" : "bg-gray-500"}`} />
                          {s.is_active ? t.staff.active : t.staff.inactive}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Staff limit upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
              <Lock className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white">Upgrade to Professional</h3>
            <p className="mt-2 text-sm text-gray-400">
              Your <span className="font-semibold text-white">Starter plan</span> supports up to{" "}
              <span className="font-semibold text-white">{STARTER_STAFF_LIMIT} staff members</span>.
              Upgrade to <span className="font-semibold text-white">Professional</span> for unlimited staff.
            </p>
            <ul className="mt-4 space-y-2 text-left">
              {[
                "Unlimited staff members",
                "Unlimited branches",
                "Advanced commission models",
                "Advanced analytics & P&L",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/settings?tab=billing"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
              >
                Upgrade Now — RM 249/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="rounded-lg py-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">{t.staff.addStaff}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.staff.fullName} *</label>
                <input
                  name="full_name"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Phone</label>
                <input
                  name="phone"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="+60 12-345 6789"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.staff.role} *</label>
                <select
                  name="role"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="barber">Barber</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="senior_barber">Senior Barber</option>
                  <option value="junior_barber">Junior Barber</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Employment Type</label>
                <select
                  name="employment_type"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Base Salary</label>
                <input
                  name="base_salary"
                  type="number"
                  min={0}
                  step={0.01}
                  defaultValue={0}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.staff.branch}</label>
                <select
                  name="branch_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">— Select branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
                >
                  {pending ? "Adding…" : t.staff.addStaff}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div>
                <h3 className="text-lg font-bold text-white">Invite Staff Member</h3>
                <p className="mt-1 text-sm text-gray-400">Send a login invite to their email</p>
              </div>
              <button type="button" onClick={() => { setShowInviteModal(false); setInviteError(null); setInviteSuccess(false); }} className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Invite Sent!</h4>
                <p className="mt-2 text-sm text-gray-400">The staff member will receive an email with a link to set up their account.</p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4 p-6">
                {inviteError && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{inviteError}</div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Full Name <span className="text-red-400">*</span></label>
                  <input name="full_name" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="e.g. Ahmad Ali" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Email <span className="text-red-400">*</span></label>
                  <input name="email" type="email" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="staff@example.com" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Role <span className="text-red-400">*</span></label>
                    <select name="role" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                      <option value="">Select role...</option>
                      <option value="manager">Manager</option>
                      <option value="barber">Barber</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch <span className="text-red-400">*</span></label>
                    <select name="branch_id" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                      <option value="">Select branch...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The staff member will receive an email invite to create their account. They will only see pages and data relevant to their role and assigned branch.
                  </p>
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => { setShowInviteModal(false); setInviteError(null); }} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={invitePending} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50">
                    {invitePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {invitePending ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
