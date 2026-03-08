"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { useCustomers, useCustomerStats } from "@/hooks";
import { createCustomer } from "@/actions/customers";

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

function getStatus(points: number): { label: string; statusColor: string } {
  if (points >= 1000) return { label: "VIP", statusColor: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" };
  if (points >= 100) return { label: "Regular", statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  return { label: "Inactive", statusColor: "bg-red-500/10 text-red-400 border-red-500/20" };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { data: customersResult, isLoading: customersLoading } = useCustomers();
  const { data: statsResult, isLoading: statsLoading } = useCustomerStats();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [pending, setPending] = useState(false);

  const customersData = customersResult?.data ?? [];
  const customersError = customersResult?.error;
  const stats = statsResult?.data ?? { total: 0, newThisMonth: 0 };

  const filteredCustomers = customersData.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createCustomer(fd);
    setPending(false);
    if (result.success) {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
    }
  }

  const STATS = [
    { label: "Total Customers", value: stats.total.toLocaleString(), icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", trend: "+12% this month", trendUp: true },
    { label: "New This Month", value: stats.newThisMonth.toLocaleString(), icon: UserPlus, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", trend: "+23% vs last", trendUp: true },
    { label: "Returning", value: "—", icon: TrendingUp, iconBg: "bg-purple-500/10", iconColor: "text-purple-400", trend: "62% retention", trendUp: true },
    { label: "VIP Members", value: customersData.filter((c) => (c.loyalty_points ?? 0) >= 1000).length.toString(), icon: Star, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]", trend: "Top spenders", trendUp: true }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Management</h2>
          <p className="mt-1 text-sm text-gray-400">View and manage your customer database</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{statsLoading ? "…" : s.value}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" /> {s.trend}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Search & filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 transition hover:text-white">
              Status <ChevronDown className="h-3 w-3" />
            </button>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 transition hover:text-white">
              Barber <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </Card>

      {/* Customer table */}
      <Card>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="font-bold text-white">Customer Database</h3>
          <p className="text-sm text-gray-500">{filteredCustomers.length} customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" /></th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Preferred Barber</th>
                <th className="p-4 text-left">Total Visits</th>
                <th className="p-4 text-left">Last Visit</th>
                <th className="p-4 text-left">Loyalty Points</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customersLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : customersError ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-red-400">
                    Failed to load customers
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const status = getStatus(c.loyalty_points ?? 0);
                  return (
                    <tr key={c.id} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                      <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">{getInitials(c.full_name)}</div>
                          <span className="font-medium text-white">{c.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{c.phone}</td>
                      <td className="p-4">
                        <span className="text-gray-400">—</span>
                      </td>
                      <td className="p-4 font-bold text-white">—</td>
                      <td className="p-4 text-gray-300">—</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-[#D4AF37] font-medium">
                          <Star className="h-3 w-3" /> {c.loyalty_points ?? 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded border px-2 py-0.5 text-xs font-bold ${status.statusColor}`}>{status.label}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><Eye className="h-4 w-4" /></button>
                          <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
                          <button type="button" className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <p className="text-xs text-gray-500">Showing 1-{filteredCustomers.length} of {filteredCustomers.length}</p>
          <div className="flex gap-1">
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:text-white">Previous</button>
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:text-white">Next</button>
          </div>
        </div>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Add Customer</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Full Name *</label>
                <input name="full_name" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="John Doe" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Phone *</label>
                <input name="phone" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="+60 12-345 6789" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input name="email" type="email" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="john@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Date of Birth</label>
                <input name="date_of_birth" type="date" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="Optional notes" />
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
                  {pending ? "Adding…" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
