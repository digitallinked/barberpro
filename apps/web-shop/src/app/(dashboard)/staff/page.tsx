"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useStaffMembers, useBranches, useStaffAttendance } from "@/hooks";
import { createStaffMember } from "@/actions/staff";
import { recordAttendance } from "@/actions/attendance";
import { useT } from "@/lib/i18n/language-context";
import { useTenant } from "@/components/tenant-provider";

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

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function attendanceStatusLabel(t: ReturnType<typeof useT>, s: string): string {
  const m: Record<string, string> = {
    present: t.staff.present,
    absent: t.staff.absent,
    late: t.staff.late,
    half_day: t.staff.halfDay,
    leave: t.staff.leave,
  };
  return m[s] ?? s;
}

const STARTER_STAFF_LIMIT = 5;

export default function StaffPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { tenantPlan } = useTenant();
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

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, setPending] = useState(false);

  const { data: attendanceWrap, isFetching: attLoading } = useStaffAttendance(attFrom, attTo);
  const attendanceRows = attendanceWrap?.data ?? [];

  const staffList = staffResult?.data ?? [];
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

  async function handleAttendanceSave(e: React.FormEvent) {
    e.preventDefault();
    if (!attStaffId || !attDate) return;
    setAttPending(true);
    setAttBanner(null);
    const fd = new FormData();
    fd.set("staff_id", attStaffId);
    fd.set("date", attDate);
    fd.set("status", attStatus);
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

  const sortedAttendance = [...attendanceRows].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    return d !== 0 ? d : (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
  });

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

      {/* Attendance — primary ops for payroll days-worked */}
      <Card className="overflow-hidden">
        <div className="border-b border-white/5 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">{t.staff.attendanceTitle}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{t.staff.attendanceSubtitle}</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-end sm:gap-2">
              <div className="min-w-0 sm:min-w-0">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  {t.staff.dateFrom}
                </label>
                <input
                  type="date"
                  value={attFrom}
                  onChange={(e) => setAttFrom(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-2 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40 sm:px-3"
                />
              </div>
              <div className="min-w-0 sm:min-w-0">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  {t.staff.dateTo}
                </label>
                <input
                  type="date"
                  value={attTo}
                  onChange={(e) => setAttTo(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-2 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40 sm:px-3"
                />
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAttendanceSave}
          className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:px-5"
        >
          <div className="w-full min-w-0 sm:min-w-[160px] sm:flex-1">
            <label className="mb-1 block text-[10px] font-medium text-gray-500">{t.staff.colStaff}</label>
            <select
              value={attStaffId}
              onChange={(e) => setAttStaffId(e.target.value)}
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
              min={attFrom}
              max={attTo}
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
            {t.staff.saveAttendance}
          </button>
        </form>

        {attBanner && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400 sm:px-5">{attBanner}</div>
        )}

        <div className="max-h-[min(420px,55vh)] overflow-auto">
          {attLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : sortedAttendance.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">{t.staff.noAttendance}</p>
            </div>
          ) : (
            <>
              {/* Mobile: stacked rows — no horizontal table scroll */}
              <div className="divide-y divide-white/[0.04] sm:hidden">
                {sortedAttendance.slice(0, 100).map((r) => (
                  <div key={r.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate font-medium text-white">{r.staff?.full_name ?? "—"}</p>
                      <span className="shrink-0 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-gray-300">
                        {attendanceStatusLabel(t, r.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-gray-500">{r.date}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.staff.colClockIn}: <span className="tabular-nums text-gray-400">{formatTime(r.clock_in)}</span>
                      {" · "}
                      {t.staff.colClockOut}: <span className="tabular-nums text-gray-400">{formatTime(r.clock_out)}</span>
                    </p>
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="sticky top-0 border-b border-white/5 bg-[#141414] text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3">{t.staff.colStaff}</th>
                    <th className="px-3 py-3">{t.staff.colDate}</th>
                    <th className="px-3 py-3">{t.staff.colClockIn}</th>
                    <th className="px-3 py-3">{t.staff.colClockOut}</th>
                    <th className="px-5 py-3">{t.staff.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttendance.slice(0, 100).map((r) => (
                    <tr key={r.id} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 font-medium text-white">{r.staff?.full_name ?? "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-400">{r.date}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-500">{formatTime(r.clock_in)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-gray-500">{formatTime(r.clock_out)}</td>
                      <td className="px-5 py-2.5 text-gray-300">{attendanceStatusLabel(t, r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Card>

      {/* Summary bar */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">
            Total: <span className="font-bold text-white">{staffLoading ? "…" : staffList.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-gray-400">
            {t.staff.active}: <span className="font-bold text-white">{activeCount}</span>
          </span>
        </div>
      </Card>

      {/* Staff grid — 1 col on phone (readable cards), 2 from sm, 3 on xl */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staffLoading ? (
          <div className="col-span-full rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          filteredStaff.map((s) => {
            const statusCls = s.is_active
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-gray-500/10 text-gray-400 border-gray-500/30";
            const branchName = s.branch_id ? (branchMap[s.branch_id] ?? "—") : "—";
            return (
              <Card
                key={s.staff_profile_id}
                className="p-4 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-sm font-bold text-white sm:h-14 sm:w-14 sm:text-lg">
                      {getInitials(s.full_name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">{s.full_name}</h3>
                      <p className="truncate text-xs text-gray-400">{formatRole(s.role)}</p>
                      <p className="truncate text-[10px] text-gray-500">{branchName}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${statusCls}`}
                  >
                    {s.is_active ? t.staff.active : t.staff.inactive}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-[#111] p-2.5 sm:mb-4 sm:gap-3 sm:p-3">
                  <div className="min-w-0 text-center">
                    <p className="text-base font-bold text-white sm:text-lg">—</p>
                    <p className="text-[9px] text-gray-500 sm:text-[10px]">Customers</p>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="text-base font-bold text-emerald-400 sm:text-lg">—</p>
                    <p className="text-[9px] text-gray-500 sm:text-[10px]">Revenue</p>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="flex items-center justify-center gap-0.5 text-base font-bold text-[#D4AF37] sm:text-lg">
                      <Star className="h-3 w-3 shrink-0" /> —
                    </p>
                    <p className="text-[9px] text-gray-500 sm:text-[10px]">Rating</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/staff/${s.staff_profile_id}`}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 py-2.5 text-xs font-medium text-white hover:bg-white/5 sm:flex-1 sm:py-2"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Profile
                  </Link>
                  <div className="flex justify-center gap-2 sm:shrink-0">
                    <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

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
    </div>
  );
}
