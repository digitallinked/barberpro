"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  Plus,
  Printer,
  X
} from "lucide-react";
import { usePayrollPeriods, usePayrollEntries, useStaffMembers, useBranches } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { createPayrollPeriod, createPayrollEntry, updatePayrollPeriodStatus } from "@/actions/payroll";
import { useTenant } from "@/components/tenant-provider";
import {
  calculateStatutoryDeductions,
  formatRM as formatRMStat,
  type MaritalStatus,
} from "@/lib/malaysian-tax";
import { openPrintableDocument } from "@/lib/print-pdf";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type PayrollEntryRow = {
  base_salary: number;
  service_commission: number;
  product_commission: number;
  bonuses: number;
  deductions: number;
  advances: number;
  net_payout: number;
  notes: string | null;
};

function buildPayslipInnerHtml(params: {
  employerName: string;
  periodLabel: string;
  staffName: string;
  entry: PayrollEntryRow;
  age: number;
  marital: MaritalStatus;
  dependents: number;
}): string {
  const { employerName, periodLabel, staffName, entry, age, marital, dependents } = params;
  const gross =
    entry.base_salary +
    entry.service_commission +
    entry.product_commission +
    entry.bonuses;
  const stat = calculateStatutoryDeductions(gross, age, {
    maritalStatus: marital,
    numDependents: dependents,
  });
  const diff = Math.round((entry.deductions - stat.totalEmployeeDeductions) * 100) / 100;

  return `
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #111; max-width: 640px; margin: 0 auto; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e5e5e5; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .foot { margin-top: 20px; font-size: 11px; color: #666; line-height: 1.5; }
</style>
<h1>Payslip (reference)</h1>
<p class="sub">${esc(employerName)} · ${esc(periodLabel)} · ${esc(staffName)}</p>
<table>
  <tr><th colspan="2">Earnings</th></tr>
  <tr><td>Base salary</td><td class="num">${formatRMStat(entry.base_salary)}</td></tr>
  <tr><td>Service commission</td><td class="num">${formatRMStat(entry.service_commission)}</td></tr>
  <tr><td>Product commission</td><td class="num">${formatRMStat(entry.product_commission)}</td></tr>
  <tr><td>Bonuses</td><td class="num">${formatRMStat(entry.bonuses)}</td></tr>
  <tr><td><strong>Gross pay</strong></td><td class="num"><strong>${formatRMStat(gross)}</strong></td></tr>
  <tr><th colspan="2">Statutory estimate (KWSP / PERKESO / SIP / PCB)</th></tr>
  <tr><td>EPF (employee)</td><td class="num">${formatRMStat(stat.epf.employeeContribution)}</td></tr>
  <tr><td>SOCSO (employee)</td><td class="num">${formatRMStat(stat.socso.employeeContribution)}</td></tr>
  <tr><td>EIS (employee)</td><td class="num">${formatRMStat(stat.eis.employeeContribution)}</td></tr>
  <tr><td>PCB / MTD (estimate)</td><td class="num">${formatRMStat(stat.pcb.monthlyPcb)}</td></tr>
  <tr><td><strong>Total statutory (estimate)</strong></td><td class="num"><strong>${formatRMStat(stat.totalEmployeeDeductions)}</strong></td></tr>
  <tr><th colspan="2">Recorded in BarberPro</th></tr>
  <tr><td>Total deductions (stored)</td><td class="num">${formatRMStat(entry.deductions)}</td></tr>
  <tr><td>Advances</td><td class="num">${formatRMStat(entry.advances)}</td></tr>
  <tr><td><strong>Net payout</strong></td><td class="num"><strong>${formatRMStat(entry.net_payout)}</strong></td></tr>
</table>
${
  Math.abs(diff) > 0.02
    ? `<p class="foot">Stored deductions differ from the statutory estimate by ${formatRMStat(Math.abs(diff))} (e.g. loans, zakat, or different PCB inputs). Use your official payroll / LHDN figures for filing.</p>`
    : ""
}
<p class="foot">PCB uses a simplified MTD model (age ${age}, marital: ${esc(marital)}, children: ${dependents}). Confirm with LHDN tables, EA form, and e-Data PCB. This document is for records only and is not legal or tax advice.</p>
${entry.notes ? `<p class="foot"><strong>Notes:</strong> ${esc(entry.notes)}</p>` : ""}
`;
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
  const { tenantName } = useTenant();
  const queryClient = useQueryClient();
  const { data: periodsResult, isLoading: periodsLoading } = usePayrollPeriods();
  const { data: branchesResult } = useBranches();
  const { data: staffResult } = useStaffMembers();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statutoryHint, setStatutoryHint] = useState<string | null>(null);
  const entryFormRef = useRef<HTMLFormElement>(null);

  const { data: entriesResult } = usePayrollEntries(selectedPeriodId);

  const periods = periodsResult?.data ?? [];
  const entries = entriesResult?.data ?? [];
  const branches = branchesResult?.data ?? [];
  const staffList = staffResult?.data ?? [];
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const totals = entries.reduce(
    (acc, e) => {
      const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
      const stat = calculateStatutoryDeductions(gross);
      return {
        base: acc.base + e.base_salary,
        serviceComm: acc.serviceComm + e.service_commission,
        productComm: acc.productComm + e.product_commission,
        bonuses: acc.bonuses + e.bonuses,
        deductions: acc.deductions + e.deductions,
        net: acc.net + e.net_payout,
        employerEpf: acc.employerEpf + stat.epf.employerContribution,
        employerSocso: acc.employerSocso + stat.socso.employerContribution,
        employerEis: acc.employerEis + stat.eis.employerContribution,
        totalEmployerCost: acc.totalEmployerCost + stat.totalEmployerCost,
      };
    },
    { base: 0, serviceComm: 0, productComm: 0, bonuses: 0, deductions: 0, net: 0, employerEpf: 0, employerSocso: 0, employerEis: 0, totalEmployerCost: 0 }
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

  function applyStatutoryToForm() {
    const f = entryFormRef.current;
    if (!f) return;
    const fd = new FormData(f);
    const base = Number(fd.get("base_salary")) || 0;
    const svc = Number(fd.get("service_commission")) || 0;
    const prod = Number(fd.get("product_commission")) || 0;
    const bonus = Number(fd.get("bonuses")) || 0;
    const gross = base + svc + prod + bonus;
    const age = Number(fd.get("statutory_age")) || 30;
    const marital = (fd.get("marital_status") as string) as MaritalStatus;
    const deps = Number(fd.get("num_dependents")) || 0;
    const stat = calculateStatutoryDeductions(gross, age, {
      maritalStatus: marital || "single",
      numDependents: deps,
    });
    const dedInput = f.elements.namedItem("deductions") as HTMLInputElement;
    dedInput.value = String(stat.totalEmployeeDeductions);
    setStatutoryHint(
      `Set deductions to statutory estimate: EPF ${formatRMStat(stat.epf.employeeContribution)}, SOCSO ${formatRMStat(stat.socso.employeeContribution)}, EIS ${formatRMStat(stat.eis.employeeContribution)}, PCB ~${formatRMStat(stat.pcb.monthlyPcb)}. Add loans/zakat in deductions manually if needed.`
    );
  }

  function printPayslip(entry: (typeof entries)[number]) {
    if (!selectedPeriod) return;
    const periodLabel = `${formatDate(selectedPeriod.period_start)} – ${formatDate(selectedPeriod.period_end)}`;
    const inner = buildPayslipInnerHtml({
      employerName: tenantName,
      periodLabel,
      staffName: entry.staff?.full_name ?? "Staff",
      entry: {
        base_salary: entry.base_salary,
        service_commission: entry.service_commission,
        product_commission: entry.product_commission,
        bonuses: entry.bonuses,
        deductions: entry.deductions,
        advances: entry.advances,
        net_payout: entry.net_payout,
        notes: entry.notes,
      },
      age: 30,
      marital: "single",
      dependents: 0,
    });
    openPrintableDocument(inner, `Payslip-${entry.staff?.full_name ?? "staff"}`);
  }

  function printPayrollRegister() {
    if (!selectedPeriod || entries.length === 0) return;
    const periodLabel = `${formatDate(selectedPeriod.period_start)} – ${formatDate(selectedPeriod.period_end)}`;
    const rows = entries
      .map(
        (e) =>
          `<tr><td>${esc(e.staff?.full_name ?? "?")}</td><td class="n">${formatRMStat(e.base_salary)}</td><td class="n">${formatRMStat(e.service_commission)}</td><td class="n">${formatRMStat(e.product_commission)}</td><td class="n">${formatRMStat(e.bonuses)}</td><td class="n">${formatRMStat(e.deductions)}</td><td class="n">${formatRMStat(e.net_payout)}</td></tr>`
      )
      .join("");
    const inner = `
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111}
h1{font-size:18px} table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:6px;border-bottom:1px solid #ddd}
.n{text-align:right;font-variant-numeric:tabular-nums}
</style>
<h1>Payroll register</h1>
<p>${esc(tenantName)} · ${esc(periodLabel)}</p>
<table><thead><tr><th>Staff</th><th class="n">Base</th><th class="n">Svc comm</th><th class="n">Prod comm</th><th class="n">Bonus</th><th class="n">Deduct.</th><th class="n">Net</th></tr></thead><tbody>${rows}</tbody></table>
<p style="font-size:11px;color:#666;margin-top:16px">For employer records. Cross-check with KWSP, PERKESO, LHDN, and bank payment files before statutory submission.</p>`;
    openPrintableDocument(inner, `Payroll-${periodLabel}`);
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
            onClick={printPayrollRegister}
            disabled={!selectedPeriodId || entries.length === 0}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Export PDF
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
                    onClick={() => {
                      setStatutoryHint(null);
                      setShowAddEntryModal(true);
                    }}
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
                      <th className="p-4 text-right">Stat. est.</th>
                      <th className="p-4 text-right">Net Payout</th>
                      <th className="p-4 text-right w-24">Payslip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          No entries for this period. Add staff entries above.
                        </td>
                      </tr>
                    ) : (
                      entries.map((e) => {
                        const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
                        const stat = calculateStatutoryDeductions(gross);
                        const diff = Math.round((e.deductions - stat.totalEmployeeDeductions) * 100) / 100;
                        return (
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
                            <td className="p-4 text-right">
                              <span className="text-gray-400 tabular-nums">{formatRM(stat.totalEmployeeDeductions)}</span>
                              {Math.abs(diff) > 0.5 && (
                                <span className={`ml-1 text-[10px] font-semibold ${diff > 0 ? "text-orange-400" : "text-sky-400"}`} title={diff > 0 ? "Deductions exceed statutory estimate" : "Deductions below statutory estimate"}>
                                  {diff > 0 ? "▲" : "▼"}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right font-bold text-white">{formatRM(e.net_payout)}</td>
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => printPayslip(e)}
                                className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                                title="Print / save as PDF"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
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

          {/* Employer statutory estimates */}
          {selectedPeriodId && entries.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-1 font-bold text-white">Employer Statutory (estimate)</h3>
              <p className="mb-3 text-[11px] text-gray-500">EPF, SOCSO &amp; EIS — employer share. Verify with KWSP / PERKESO / SOCSO portals before filing.</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">EPF employer</span>
                  <span className="text-white">{formatRM(totals.employerEpf)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SOCSO employer</span>
                  <span className="text-white">{formatRM(totals.employerSocso)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EIS employer</span>
                  <span className="text-white">{formatRM(totals.employerEis)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 font-bold">
                  <span className="text-white">Total employer cost</span>
                  <span className="text-orange-400">{formatRM(totals.totalEmployerCost)}</span>
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
                Use &quot;Apply statutory&quot; when adding an entry to pre-fill EPF, SOCSO, EIS, and PCB (estimate).
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
            <form ref={entryFormRef} onSubmit={handleAddEntry} className="space-y-4">
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
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  Malaysia statutory (estimate)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">Age</label>
                    <input
                      name="statutory_age"
                      type="number"
                      min={16}
                      max={100}
                      defaultValue={30}
                      className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] text-gray-500">Marital (PCB)</label>
                    <select
                      name="marital_status"
                      className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                    >
                      <option value="single">Single / divorced / widowed</option>
                      <option value="married_spouse_no_income">Married, spouse not working</option>
                      <option value="married_spouse_income">Married, spouse has income</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">Children (relief)</label>
                    <input
                      name="num_dependents"
                      type="number"
                      min={0}
                      max={20}
                      defaultValue={0}
                      className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyStatutoryToForm}
                  className="mt-3 w-full rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20"
                >
                  Apply statutory to deductions (EPF + SOCSO + EIS + PCB estimate)
                </button>
                {statutoryHint && (
                  <p className="mt-2 text-[11px] leading-relaxed text-gray-400">{statutoryHint}</p>
                )}
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Advances</label>
                  <input
                    name="advances"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. overtime, zakat reference"
                />
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
