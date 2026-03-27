"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  Minus,
  Plus,
  TrendingUp,
  X
} from "lucide-react";
import { usePayrollPeriods, usePayrollEntries, useStaffMembers, useBranches } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { createPayrollPeriod, createPayrollEntry, updatePayrollPeriodStatus } from "@/actions/payroll";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
    pending_review: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    approved: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" }
  };
  const s = map[status] ?? map.draft;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`rounded border px-2 py-0.5 text-xs font-bold ${s.bg} ${s.text} ${s.border}`}>{label}</span>;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PayrollPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: periodsResult, isLoading: periodsLoading } = usePayrollPeriods();
  const { data: branchesResult } = useBranches();
  const { data: staffResult } = useStaffMembers();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: entriesResult } = usePayrollEntries(selectedPeriodId);

  const periods = periodsResult?.data ?? [];
  const entries = entriesResult?.data ?? [];
  const branches = branchesResult?.data ?? [];
  const staffList = staffResult?.data ?? [];
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const totals = entries.reduce(
    (acc, e) => ({
      base: acc.base + e.base_salary,
      serviceComm: acc.serviceComm + e.service_commission,
      productComm: acc.productComm + e.product_commission,
      bonuses: acc.bonuses + e.bonuses,
      deductions: acc.deductions + e.deductions,
      net: acc.net + e.net_payout
    }),
    { base: 0, serviceComm: 0, productComm: 0, bonuses: 0, deductions: 0, net: 0 }
  );

  const topEarners = [...entries]
    .sort((a, b) => b.net_payout - a.net_payout)
    .slice(0, 3)
    .map((e, i) => ({
      name: e.staff?.full_name ?? "Unknown",
      init: getInitials(e.staff?.full_name ?? "?"),
      amount: formatRM(e.net_payout),
      rank: i + 1
    }));

  async function handleNewPeriod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createPayrollPeriod(fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setShowNewPeriodModal(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to create period");
    }
  }

  async function handleAddEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPeriodId) return;
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("payroll_period_id", selectedPeriodId);
    const result = await createPayrollEntry(fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      setShowAddEntryModal(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to add entry");
    }
  }

  async function handleUpdateStatus(status: string) {
    if (!selectedPeriodId) return;
    setPending(true);
    const result = await updatePayrollPeriodStatus(selectedPeriodId, status);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.payroll.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.payroll.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowNewPeriodModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Banknote className="h-4 w-4" /> New Period
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Period list */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="font-bold text-white">Payroll Periods</h3>
            </div>
            {periodsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
              </div>
            ) : periods.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No payroll periods yet. Create one to get started.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriodId(p.id)}
                    className={`flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/[0.02] ${
                      selectedPeriodId === p.id ? "bg-[#D4AF37]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-white">
                        {formatDate(p.period_start)} – {formatDate(p.period_end)}
                      </span>
                    </div>
                    {getStatusBadge(p.status)}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Entries table */}
          {selectedPeriodId && (
            <Card>
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <h3 className="font-bold text-white">Payroll Breakdown</h3>
                <div className="flex items-center gap-2">
                  {selectedPeriod && (
                    <>
                      {selectedPeriod.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus("pending_review")}
                          disabled={pending}
                          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-50"
                        >
                          Submit for Review
                        </button>
                      )}
                      {selectedPeriod.status === "pending_review" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus("approved")}
                          disabled={pending}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {selectedPeriod.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus("paid")}
                          disabled={pending}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddEntryModal(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Entry
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="p-4 text-left">Staff</th>
                      <th className="p-4 text-right">Base Salary</th>
                      <th className="p-4 text-right">Service Comm.</th>
                      <th className="p-4 text-right">Product Comm.</th>
                      <th className="p-4 text-right">Bonuses</th>
                      <th className="p-4 text-right">Deductions</th>
                      <th className="p-4 text-right">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No entries for this period. Add staff entries above.
                        </td>
                      </tr>
                    ) : (
                      entries.map((e) => (
                        <tr key={e.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">
                                {getInitials(e.staff?.full_name ?? "?")}
                              </div>
                              <span className="font-medium text-white">{e.staff?.full_name ?? "Unknown"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right text-gray-300">{formatRM(e.base_salary)}</td>
                          <td className="p-4 text-right text-emerald-400">{formatRM(e.service_commission)}</td>
                          <td className="p-4 text-right text-blue-400">{formatRM(e.product_commission)}</td>
                          <td className="p-4 text-right text-[#D4AF37]">{formatRM(e.bonuses)}</td>
                          <td className="p-4 text-right text-red-400">{formatRM(e.deductions)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatRM(e.net_payout)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Net payout banner */}
          {selectedPeriodId && entries.length > 0 && (
            <Card className="border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Net Payout This Period</p>
                  <h3 className="mt-1 text-3xl font-bold text-white">{formatRM(totals.net)}</h3>
                </div>
                <CircleDollarSign className="h-8 w-8 text-[#D4AF37]/40" />
              </div>
            </Card>
          )}

          {/* Top earners */}
          {selectedPeriodId && entries.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-4 font-bold text-white">Top Earners This Period</h3>
              <div className="space-y-3">
                {topEarners.map((e) => (
                  <div key={e.name} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#2a2a2a] text-sm font-bold text-white">
                        {e.init}
                      </div>
                      {e.rank === 1 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-black">
                          1
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{e.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${e.rank === 1 ? "text-[#D4AF37]" : "text-gray-300"}`}>
                      {e.amount}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Payroll summary */}
          {selectedPeriodId && entries.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-4 font-bold text-white">Payroll Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Base Salaries</span>
                  <span className="text-white">{formatRM(totals.base)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Commissions</span>
                  <span className="text-emerald-400">{formatRM(totals.serviceComm + totals.productComm)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Bonuses</span>
                  <span className="text-[#D4AF37]">{formatRM(totals.bonuses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Deductions</span>
                  <span className="text-red-400">- {formatRM(totals.deductions)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 font-bold">
                  <span className="text-white">Net Payout</span>
                  <span className="text-[#D4AF37]">{formatRM(totals.net)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Payment schedule */}
          {selectedPeriod && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Payment Schedule</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-gray-400">Period:</span>
                  <span className="font-medium text-white">
                    {formatDate(selectedPeriod.period_start)} – {formatDate(selectedPeriod.period_end)}
                  </span>
                </div>
                {selectedPeriod.payout_due_date && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-400">Due:</span>
                    <span className="font-medium text-white">{formatDate(selectedPeriod.payout_due_date)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-gray-400">{entries.length} entries</span>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Payroll Notes</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" />
                Commission rates are configured per staff in the Commissions page.
              </li>
              <li className="flex items-start gap-2">
                <FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-600" />
                SOCSO &amp; EPF can be included in deductions per entry.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* New Period Modal */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">New Payroll Period</h3>
              <button
                type="button"
                onClick={() => setShowNewPeriodModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleNewPeriod} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Period Start</label>
                <input
                  name="period_start"
                  type="date"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Period End</label>
                <input
                  name="period_end"
                  type="date"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Branch (optional)</label>
                <select
                  name="branch_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">All branches</option>
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
                  onClick={() => setShowNewPeriodModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? "Creating…" : "Create Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddEntryModal && selectedPeriodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Payroll Entry</h3>
              <button
                type="button"
                onClick={() => setShowAddEntryModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Staff</label>
                <select
                  name="staff_id"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.staff_profile_id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Base Salary</label>
                  <input
                    name="base_salary"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Service Commission</label>
                  <input
                    name="service_commission"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Product Commission</label>
                  <input
                    name="product_commission"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Bonuses</label>
                  <input
                    name="bonuses"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Deductions</label>
                  <input
                    name="deductions"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEntryModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? "Adding…" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
