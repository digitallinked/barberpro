"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Users
} from "lucide-react";
import Link from "next/link";
import { useStaffMembers, useBranches } from "@/hooks";
import { createStaffMember } from "@/actions/staff";

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { data: staffResult, isLoading: staffLoading } = useStaffMembers();
  const { data: branchesResult } = useBranches();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [pending, setPending] = useState(false);

  const staffList = staffResult?.data ?? [];
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Management</h2>
          <p className="mt-1 text-sm text-gray-400">View and manage your barber team</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-lg border border-white/10 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <Card className="flex flex-wrap items-center gap-6 p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">Total: <span className="font-bold text-white">{staffLoading ? "…" : staffList.length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-gray-400">Available: <span className="font-bold text-white">{activeCount}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm text-gray-400">Serving: <span className="font-bold text-white">0</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-sm text-gray-400">Break: <span className="font-bold text-white">0</span></span>
        </div>
      </Card>

      {/* Staff grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staffLoading ? (
          <div className="col-span-full rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          filteredStaff.map((s) => {
            const statusCls = s.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-gray-500/10 text-gray-400 border-gray-500/30";
            const branchName = s.branch_id ? (branchMap[s.branch_id] ?? "—") : "—";
            return (
              <Card key={s.staff_profile_id} className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-lg font-bold text-white">
                      {getInitials(s.full_name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{s.full_name}</h3>
                      <p className="text-xs text-gray-400">{formatRole(s.role)}</p>
                      <p className="text-[10px] text-gray-500">{branchName}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCls}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-[#111] p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">—</p>
                    <p className="text-[10px] text-gray-500">Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">—</p>
                    <p className="text-[10px] text-gray-500">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#D4AF37] flex items-center justify-center gap-0.5">
                      <Star className="h-3 w-3" /> —
                    </p>
                    <p className="text-[10px] text-gray-500">Rating</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/staff/${s.staff_profile_id}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 py-2 text-xs font-medium text-white hover:bg-white/5">
                    <Eye className="h-3.5 w-3.5" /> View Profile
                  </Link>
                  <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" className="rounded-lg border border-white/10 p-2 text-gray-500 hover:text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Add Staff</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Full Name *</label>
                <input name="full_name" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="John Doe" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input name="email" type="email" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="john@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Phone</label>
                <input name="phone" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="+60 12-345 6789" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Role *</label>
                <select name="role" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
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
                <select name="employment_type" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Base Salary</label>
                <input name="base_salary" type="number" min={0} step={0.01} defaultValue={0} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Branch</label>
                <select name="branch_id" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">— Select branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
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
                  {pending ? "Adding…" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
