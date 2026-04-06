"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { useCustomers, useCustomerStats, useCustomerVisitStats } from "@/hooks";
import { createCustomer, updateCustomer, deleteCustomer } from "@/actions/customers";
import { useT } from "@/lib/i18n/language-context";

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
  const t = useT();
  const queryClient = useQueryClient();
  const { data: customersResult, isLoading: customersLoading } = useCustomers();
  const { data: statsResult, isLoading: statsLoading } = useCustomerStats();
  const { data: visitStatsResult } = useCustomerVisitStats();
  const visitStats = visitStatsResult?.data;

  type EditCustomer = { id: string; full_name: string; phone: string; email: string | null; date_of_birth: string | null; notes: string | null };

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<EditCustomer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editPending, setEditPending] = useState(false);

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

  async function handleEditCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editCustomer) return;
    setEditPending(true);
    const result = await updateCustomer(editCustomer.id, new FormData(e.currentTarget));
    setEditPending(false);
    if (result.success) {
      setEditCustomer(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } else {
      alert(result.error);
    }
  }

  async function handleDeleteCustomer(id: string) {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    setDeletingId(id);
    const result = await deleteCustomer(id);
    setDeletingId(null);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
    } else {
      alert(result.error);
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
          <h2 className="text-xl font-bold text-white">{t.customers.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.customers.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40 sm:w-auto">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> {t.customers.addCustomer}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
        <div className="sm:hidden divide-y divide-white/5 border-t border-white/5">
          {customersLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : customersError ? (
            <div className="p-8 text-center text-red-400">Failed to load customers</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customers found</div>
          ) : (
            filteredCustomers.map((c) => {
              const status = getStatus(c.loyalty_points ?? 0);
              return (
                <div key={c.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">
                      {getInitials(c.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{c.full_name}</p>
                      {c.email ? <p className="truncate text-xs text-gray-500">{c.email}</p> : null}
                      <p className="mt-1 text-sm text-gray-300">{c.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-medium text-[#D4AF37]">
                      <Star className="h-3 w-3" /> {c.loyalty_points ?? 0}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${status.statusColor}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-1 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditCustomer({
                          id: c.id,
                          full_name: c.full_name,
                          phone: c.phone,
                          email: c.email ?? null,
                          date_of_birth: c.date_of_birth ?? null,
                          notes: c.notes ?? null
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-[#D4AF37]"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(c.id)}
                      disabled={deletingId === c.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-red-400 disabled:opacity-50"
                    >
                      <MoreHorizontal className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="hidden overflow-x-auto sm:block">
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
                          <div>
                            <span className="font-medium text-white">{c.full_name}</span>
                            {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{c.phone}</td>
                      <td className="p-4">
                        <span className="text-gray-400">—</span>
                      </td>
                      <td className="p-4 font-bold text-white">
                        {visitStats ? (visitStats.get(c.id)?.count ?? 0) : "—"}
                      </td>
                      <td className="p-4 text-gray-300">
                        {visitStats
                          ? visitStats.get(c.id)?.lastVisit
                            ? new Date(visitStats.get(c.id)!.lastVisit).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
                            : "Never"
                          : "—"}
                      </td>
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
                          <button
                            type="button"
                            onClick={() => setEditCustomer({ id: c.id, full_name: c.full_name, phone: c.phone, email: c.email ?? null, date_of_birth: c.date_of_birth ?? null, notes: c.notes ?? null })}
                            className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-[#D4AF37]"
                            title="Edit"
                          ><Pencil className="h-4 w-4" /></button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id)}
                            disabled={deletingId === c.id}
                            className="rounded p-1 text-gray-500 transition hover:bg-white/5 hover:text-red-400 disabled:opacity-50"
                            title="Delete"
                          ><MoreHorizontal className="h-4 w-4" /></button>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
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

      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Edit Customer</h3>
            <form onSubmit={handleEditCustomer} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Full Name *</label>
                <input name="full_name" required defaultValue={editCustomer.full_name}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Phone *</label>
                <input name="phone" required defaultValue={editCustomer.phone}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input name="email" type="email" defaultValue={editCustomer.email ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Date of Birth</label>
                <input name="date_of_birth" type="date" defaultValue={editCustomer.date_of_birth ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
                <textarea name="notes" rows={2} defaultValue={editCustomer.notes ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditCustomer(null)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={editPending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50">
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
