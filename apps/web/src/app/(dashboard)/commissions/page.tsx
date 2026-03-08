"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Percent,
  Plus,
  Save,
  Scissors,
  ShoppingBag,
  Target,
  TrendingUp,
  User,
  Users,
  X
} from "lucide-react";
import { useCommissionSchemes, useStaffAssignments, useStaffMembers } from "@/hooks";
import { createCommissionScheme, assignCommissionScheme } from "@/actions/commissions";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

const PAYOUT_MODELS = [
  { id: "fixed_salary", name: "Fixed Salary", desc: "Monthly fixed amount", icon: Banknote },
  { id: "per_customer", name: "Per Customer", desc: "Pay per customer served", icon: User },
  { id: "per_service", name: "Per Service", desc: "Fixed rate per service", icon: Scissors },
  { id: "percentage", name: "Percentage", desc: "Percentage of service revenue", icon: Percent },
  { id: "product_commission", name: "Product Commission", desc: "Percentage of product sales", icon: ShoppingBag },
  { id: "hybrid", name: "Hybrid Model", desc: "Base + commissions + bonus", icon: TrendingUp }
];

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CommissionsPage() {
  const queryClient = useQueryClient();
  const { data: schemesResult } = useCommissionSchemes();
  const { data: assignmentsResult } = useStaffAssignments();
  const { data: staffResult } = useStaffMembers();

  const [showNewSchemeModal, setShowNewSchemeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schemes = schemesResult?.data ?? [];
  const assignments = assignmentsResult?.data ?? [];
  const staffList = staffResult?.data ?? [];

  async function handleNewScheme(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createCommissionScheme(fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["commission-schemes"] });
      setShowNewSchemeModal(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to create scheme");
    }
  }

  async function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await assignCommissionScheme(fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["staff-assignments"] });
      setShowAssignModal(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to assign scheme");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Staff Commission Setup</h1>
          <p className="mt-1 text-sm text-gray-400">Configure commission schemes and assign to staff</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewSchemeModal(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:border-[#D4AF37]/40"
          >
            <Plus className="h-4 w-4" /> New Scheme
          </button>
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Save className="h-4 w-4" /> Assign to Staff
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Commission schemes */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
              <Target className="h-4 w-4 text-[#D4AF37]" /> Commission Schemes
            </h2>
            {schemes.length === 0 ? (
              <div className="rounded-lg border border-white/5 bg-[#111] p-8 text-center text-sm text-gray-500">
                No commission schemes yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {schemes.map((s) => {
                  const model = PAYOUT_MODELS.find((m) => m.id === s.payout_model);
                  const Icon = model?.icon ?? Banknote;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-white/5 bg-[#111] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-[#D4AF37]/10 p-2">
                            <Icon className="h-4 w-4 text-[#D4AF37]" />
                          </span>
                          <div>
                            <h3 className="font-semibold text-white">{s.name}</h3>
                            <p className="text-xs text-gray-500">
                              {model?.name ?? s.payout_model} • {s.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        {s.base_salary > 0 && (
                          <span className="text-gray-400">
                            Base: <span className="font-medium text-white">{formatRM(s.base_salary)}</span>
                          </span>
                        )}
                        {s.per_customer_amount > 0 && (
                          <span className="text-gray-400">
                            Per customer: <span className="font-medium text-white">{formatRM(s.per_customer_amount)}</span>
                          </span>
                        )}
                        {s.per_service_amount > 0 && (
                          <span className="text-gray-400">
                            Per service: <span className="font-medium text-white">{formatRM(s.per_service_amount)}</span>
                          </span>
                        )}
                        {s.percentage_rate > 0 && (
                          <span className="text-gray-400">
                            Rate: <span className="font-medium text-emerald-400">{s.percentage_rate}%</span>
                          </span>
                        )}
                        {s.product_commission_rate > 0 && (
                          <span className="text-gray-400">
                            Product: <span className="font-medium text-blue-400">{s.product_commission_rate}%</span>
                          </span>
                        )}
                        {s.base_salary === 0 &&
                          s.per_customer_amount === 0 &&
                          s.per_service_amount === 0 &&
                          s.percentage_rate === 0 &&
                          s.product_commission_rate === 0 && (
                            <span className="text-gray-500">No rates configured</span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Staff assignments */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
              <Users className="h-4 w-4 text-[#D4AF37]" /> Staff Assignments
            </h2>
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-white/5 bg-[#111] p-8 text-center text-sm text-gray-500">
                No staff assignments yet. Assign a scheme to staff above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="pb-3 text-left">Staff</th>
                      <th className="pb-3 text-left">Scheme</th>
                      <th className="pb-3 text-left">Effective From</th>
                      <th className="pb-3 text-left">Effective To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className="border-t border-white/[0.04]">
                        <td className="py-3 font-medium text-white">{a.staff?.full_name ?? "Unknown"}</td>
                        <td className="py-3 text-gray-300">{a.scheme?.name ?? "Unknown"}</td>
                        <td className="py-3 text-gray-300">{formatDate(a.effective_from)}</td>
                        <td className="py-3 text-gray-500">{a.effective_to ? formatDate(a.effective_to) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right panel - Payout models reference */}
        <div className="space-y-6">
          <Card className="sticky top-24 p-5">
            <h3 className="mb-4 font-bold text-white">Payout Models</h3>
            <div className="space-y-2 text-xs text-gray-400">
              {PAYOUT_MODELS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    <span className="font-medium text-gray-300">{m.name}</span>
                    <span className="text-gray-500">— {m.desc}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* New Scheme Modal */}
      {showNewSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">New Commission Scheme</h3>
              <button
                type="button"
                onClick={() => setShowNewSchemeModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleNewScheme} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Senior Barber Commission"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37] placeholder-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Payout Model</label>
                <select
                  name="payout_model"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  {PAYOUT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Base Salary (RM)</label>
                  <input
                    name="base_salary"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Per Customer (RM)</label>
                  <input
                    name="per_customer_amount"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Per Service (RM)</label>
                  <input
                    name="per_service_amount"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Percentage Rate (%)</label>
                  <input
                    name="percentage_rate"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Product Commission (%)</label>
                  <input
                    name="product_commission_rate"
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
                  onClick={() => setShowNewSchemeModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? "Creating…" : "Create Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Assign Scheme to Staff</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
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
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Scheme</label>
                <select
                  name="scheme_id"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Select scheme</option>
                  {schemes.filter((s) => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Effective From</label>
                <input
                  name="effective_from"
                  type="date"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? "Assigning…" : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
