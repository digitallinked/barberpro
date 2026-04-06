"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  CircleDollarSign,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useExpenses, useExpenseStats } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expenses";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function formatAmount(amount: number) {
  return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatPaymentMethod(method: string) {
  return method
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "duitnow_qr", label: "DuitNow QR" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: expensesResult, isLoading: expensesLoading } = useExpenses();
  const { data: statsResult, isLoading: statsLoading } = useExpenseStats();

  type EditExpense = {
    id: string; category: string; vendor: string | null; amount: number;
    payment_method: string; expense_date: string; notes: string | null;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<EditExpense | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const expensesData = expensesResult?.data ?? [];
  const expensesError = expensesResult?.error;
  const stats = statsResult?.data ?? { total: 0, thisMonth: 0 };

  const filtered = search
    ? expensesData.filter(
        (e) =>
          e.category?.toLowerCase().includes(search.toLowerCase()) ||
          e.vendor?.toLowerCase().includes(search.toLowerCase()) ||
          e.notes?.toLowerCase().includes(search.toLowerCase())
      )
    : expensesData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createExpense(fd);
    setPending(false);
    if (result.success) {
      setShowAddModal(false);
      e.currentTarget.reset();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    const result = await deleteExpense(id);
    setDeletingId(null);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editExpense) return;
    setEditPending(true);
    const result = await updateExpense(editExpense.id, new FormData(e.currentTarget));
    setEditPending(false);
    if (result.success) {
      setEditExpense(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }

  const STATS = [
    { label: "Total Expenses", value: formatAmount(stats.total), icon: CircleDollarSign, iconBg: "bg-red-500/10", iconColor: "text-red-400" },
    { label: "This Month", value: formatAmount(stats.thisMonth), icon: BarChart2, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.expenses.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.expenses.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> {t.expenses.addExpense}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{statsLoading ? "…" : s.value}</h3>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="font-bold text-white">All Expenses</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-36 rounded-lg border border-white/10 bg-[#111] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]"
              />
            </div>
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-2 py-1.5 text-xs text-gray-400">
              <ChevronDown className="h-3 w-3" /> Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Vendor</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Notes</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expensesLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : expensesError ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-400">Failed to load expenses</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No expenses found</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <span className="rounded px-2 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-400">{e.category}</span>
                    </td>
                    <td className="p-4 font-medium text-white">{e.vendor ?? "—"}</td>
                    <td className="p-4 font-bold text-red-400">- {formatAmount(e.amount)}</td>
                    <td className="p-4 text-gray-300">{formatPaymentMethod(e.payment_method)}</td>
                    <td className="p-4 text-gray-300">{formatDate(e.expense_date)}</td>
                    <td className="p-4">
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold ${getStatusStyle(e.status ?? "pending")}`}>
                        {e.status ?? "pending"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 max-w-[120px] truncate" title={e.notes ?? ""}>
                      {e.notes ?? "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditExpense({ id: e.id, category: e.category, vendor: e.vendor ?? null, amount: e.amount, payment_method: e.payment_method, expense_date: e.expense_date, notes: e.notes ?? null })}
                          className="rounded p-1 text-gray-500 hover:text-[#D4AF37]"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          disabled={!!deletingId}
                          className="rounded p-1 text-gray-500 hover:text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <p className="text-xs text-gray-500">Showing 1-{filtered.length} of {filtered.length}</p>
          <div className="flex gap-1">
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400">Previous</button>
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400">Next</button>
          </div>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Add Expense</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Category *</label>
                <input
                  name="category"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. Utilities, Supplies"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Vendor</label>
                <input
                  name="vendor"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Payment Method *</label>
                <select
                  name="payment_method"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Date *</label>
                <input
                  name="expense_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Optional notes"
                />
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
                  {pending ? "Adding…" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Edit Expense</h3>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Category *</label>
                <input name="category" required defaultValue={editExpense.category}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Vendor</label>
                <input name="vendor" defaultValue={editExpense.vendor ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount *</label>
                <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={editExpense.amount}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Payment Method *</label>
                <select name="payment_method" required defaultValue={editExpense.payment_method}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Date *</label>
                <input name="expense_date" type="date" required defaultValue={editExpense.expense_date}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
                <textarea name="notes" rows={2} defaultValue={editExpense.notes ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditExpense(null)}
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
