"use client";

import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck2,
  CircleDollarSign,
  FileText,
  Pencil,
  Star,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";
import { useStaffMember, useBranches } from "@/hooks";

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
    junior_barber: "Junior Barber"
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(t: string): string {
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract"
  };
  return map[t] ?? t.replace(/_/g, " ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function MiniChart() {
  const bars = [60, 75, 55, 85, 70, 90, 65];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex h-20 items-end gap-2">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div style={{ height: `${(v / 100) * 60}px` }} className={`w-full rounded-t ${i === 5 ? "bg-[#D4AF37]" : "bg-[#D4AF37]/20"}`} />
          <span className="text-[9px] text-gray-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: staffResult, isLoading } = useStaffMember(id);
  const { data: branchesData } = useBranches();

  const staff = staffResult?.data ?? null;
  const branches = branchesData?.data ?? [];
  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const branchName = staff?.branch_id ? (branchMap[staff.branch_id] ?? "—") : "—";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/staff" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="space-y-6">
        <Link href="/staff" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-red-400">
          Staff member not found
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Total Customers", value: "—", icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { label: "Total Revenue", value: "—", icon: CircleDollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { label: "Commissions", value: "—", icon: TrendingUp, iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
    { label: "Product Sales", value: "—", icon: CircleDollarSign, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]" },
    { label: "Avg Rating", value: "—", icon: Star, iconBg: "bg-orange-500/10", iconColor: "text-orange-400" }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Staff
      </Link>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-2xl font-bold text-[#D4AF37]">
              {getInitials(staff.full_name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{staff.full_name}</h1>
              <p className="text-gray-400">{formatRole(staff.role)} • {branchName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarCheck2 className="h-3 w-3" /> Joined {formatDate(staff.joined_at ?? staff.created_at)}</span>
                {staff.phone && <span>{staff.phone}</span>}
                {staff.employee_code && <span>Code: {staff.employee_code}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${staff.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-gray-500/30 bg-gray-500/10 text-gray-400"}`}>
              {staff.is_active ? "Active" : "Inactive"}
            </span>
            <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:text-white">
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </div>
        </div>
      </Card>

      {/* 5 stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 text-center">
              <span className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
                <Icon className={`h-5 w-5 ${s.iconColor}`} />
              </span>
              <h3 className="text-3xl font-bold text-white">{s.value}</h3>
              <p className="mt-1 text-xs text-gray-500">{s.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Performance */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white">Performance Overview</h3>
              <div className="flex gap-1">
                <button type="button" className="rounded-md bg-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-white">Week</button>
                <button type="button" className="rounded-md bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111]">Month</button>
              </div>
            </div>
            <MiniChart />
          </Card>

          {/* Recent services table */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Recent Services Completed</h3>
              <button type="button" className="text-sm font-medium text-[#D4AF37]">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="p-4 text-left">Date &amp; Time</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Service</th>
                    <th className="p-4 text-left">Duration</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No data yet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer stats */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">Customer Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Repeat customers</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">New customers</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Avg ticket</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Customers/day</span>
                <span className="font-bold text-white">—</span>
              </div>
            </div>
          </Card>

          {/* Attendance */}
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-white">Attendance Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Days worked</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Late arrivals</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Sick leave</span>
                <span className="font-bold text-white">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">On time %</span>
                <span className="font-bold text-white">—</span>
              </div>
            </div>
          </Card>

          {/* Payroll scheme */}
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-white">Payroll Scheme</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Base salary</span><span className="text-white">RM {staff.base_salary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Employment type</span><span className="text-emerald-400">{formatEmploymentType(staff.employment_type)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">EPF deduction</span><span className="text-red-400">—</span></div>
              <div className="flex justify-between"><span className="text-gray-400">SOCSO</span><span className="text-blue-400">—</span></div>
            </div>
          </Card>

          {/* Internal notes */}
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-white">Internal Notes</h3>
            <div className="space-y-2">
              <div className="rounded-lg bg-[#111] p-3 text-center text-xs text-gray-500">
                No data yet
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
