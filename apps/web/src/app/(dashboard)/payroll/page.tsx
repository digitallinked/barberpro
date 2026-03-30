"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  LayoutList,
  Pencil,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
  Wand2,
  X,
} from "lucide-react";
import {
  usePayrollPeriods,
  usePayrollEntries,
  useStaffMembers,
  useBranches,
  useStaffCommission,
  useStaffAttendanceSummary,
} from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import {
  createPayrollPeriod,
  createPayrollEntry,
  updatePayrollPeriodStatus,
  generatePayrollEntries,
  updatePayrollEntry,
  deletePayrollEntry,
} from "@/actions/payroll";
import { useTenant } from "@/components/tenant-provider";
import {
  calculateStatutoryDeductions,
  formatRM as formatRMStat,
  type MaritalStatus,
} from "@/lib/malaysian-tax";
import { openPrintableDocument } from "@/lib/print-pdf";
import type { PayrollEntryWithStaff } from "@/services/payroll";

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
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", dot: "bg-gray-400" },
    pending_review: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400" },
    approved: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
    paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  };
  const s = map[status] ?? map.draft;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
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
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntryWithStaff | null>(null);
  const [payslipEntry, setPayslipEntry] = useState<PayrollEntryWithStaff | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statutoryHint, setStatutoryHint] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const entryFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const [addStaffId, setAddStaffId] = useState("");

  const { data: entriesResult } = usePayrollEntries(selectedPeriodId);

  const periods = periodsResult?.data ?? [];
  const entries = entriesResult?.data ?? [];
  const branches = branchesResult?.data ?? [];
  const staffList = staffResult?.data ?? [];
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const periodStart = selectedPeriod?.period_start ?? null;
  const periodEnd = selectedPeriod?.period_end ?? null;

  const { data: commissionPreview, isFetching: commissionLoading } = useStaffCommission(
    addStaffId || null,
    periodStart,
    periodEnd
  );
  const { data: attPreview } = useStaffAttendanceSummary(addStaffId || null, periodStart, periodEnd);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const totals = entries.reduce(
    (acc, e) => {
      const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
      const stat = calculateStatutoryDeductions(gross);
      const rev = (e.service_revenue ?? 0) + (e.product_revenue ?? 0);
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
        daysWorked: acc.daysWorked + (e.days_worked ?? 0),
        revenue: acc.revenue + rev,
      };
    },
    {
      base: 0, serviceComm: 0, productComm: 0, bonuses: 0, deductions: 0, net: 0,
      employerEpf: 0, employerSocso: 0, employerEis: 0, totalEmployerCost: 0,
      daysWorked: 0, revenue: 0,
    }
  );

  const grossTotal = totals.base + totals.serviceComm + totals.productComm + totals.bonuses;
  const avgDaysWorked = entries.length > 0 ? totals.daysWorked / entries.length : 0;

  const topEarners = [...entries]
    .sort((a, b) => b.net_payout - a.net_payout)
    .slice(0, 3)
    .map((e, i) => ({
      name: e.staff?.full_name ?? "Unknown",
      init: getInitials(e.staff?.full_name ?? "?"),
      amount: formatRM(e.net_payout),
      rank: i + 1,
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
      setAddStaffId("");
      (e.target as HTMLFormElement).reset();
    } else {
      setFormError(result.error ?? "Failed to add entry");
    }
  }

  async function handleEditEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingEntry) return;
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await updatePayrollEntry(editingEntry.id, fd);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      setShowEditEntryModal(false);
      setEditingEntry(null);
    } else {
      setFormError(result.error ?? "Failed to update entry");
    }
  }

  async function handleDeleteEntry(id: string) {
    if (!confirm("Delete this payroll entry?")) return;
    setPending(true);
    const result = await deletePayrollEntry(id);
    setPending(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      setExpandedEntryId(null);
    }
  }

  async function handleGenerateAll() {
    if (!selectedPeriodId) return;
    setPending(true);
    setBanner(null);
    const result = await generatePayrollEntries(selectedPeriodId);
    setPending(false);
    if (result.success && "generated" in result) {
      queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
      setBanner(
        `Generated ${result.generated} new entries. ${result.skipped} staff skipped (already have an entry or inactive).`
      );
    } else if (!result.success) {
      setBanner("error" in result ? String(result.error) : "Generate failed");
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

  function applyStatutoryToForm(ref: React.RefObject<HTMLFormElement | null>) {
    const f = ref.current;
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

  const selectedStaffBase = staffList.find((s) => s.staff_profile_id === addStaffId)?.base_salary ?? 0;

  const summaryCards = [
    { label: t.payroll.totalBase, value: formatRM(totals.base), color: "text-white", icon: Banknote, iconBg: "bg-gray-500/10", iconColor: "text-gray-400" },
    { label: t.payroll.totalCommissions, value: formatRM(totals.serviceComm + totals.productComm), color: "text-emerald-400", icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { label: t.payroll.totalBonuses, value: formatRM(totals.bonuses), color: "text-[#D4AF37]", icon: CircleDollarSign, iconBg: "bg-[#D4AF37]/10", iconColor: "text-[#D4AF37]" },
    { label: t.payroll.totalDeductions, value: `- ${formatRM(totals.deductions)}`, color: "text-red-400", icon: FileText, iconBg: "bg-red-500/10", iconColor: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{t.payroll.title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{t.payroll.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printPayrollRegister}
            disabled={!selectedPeriodId || entries.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <Download className="h-4 w-4" /> {t.payroll.exportPdf}
          </button>
          <button
            type="button"
            onClick={() => setShowNewPeriodModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> {t.payroll.newPeriod}
          </button>
        </div>
      </div>

      {banner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {banner}
          <button type="button" onClick={() => setBanner(null)} className="ml-auto text-gray-500 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Period selector strip */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a]">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <h3 className="text-sm font-semibold text-white">{t.payroll.periodsTitle}</h3>
        </div>
        {periodsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          </div>
        ) : periods.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-500">{t.payroll.noPeriods}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-3">
            {periods.map((p) => {
              const active = selectedPeriodId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriodId(p.id)}
                  className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                    active
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-white shadow-sm"
                      : "border-white/5 bg-[#111] text-gray-400 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <CalendarDays className={`h-4 w-4 ${active ? "text-[#D4AF37]" : "text-gray-600"}`} />
                  <span className="font-medium">
                    {formatDate(p.period_start)} – {formatDate(p.period_end)}
                  </span>
                  {getStatusBadge(p.status)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stat cards — only when a period is selected and has entries */}
      {selectedPeriodId && entries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Net payout hero card */}
          <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/70">
              {t.payroll.netPayoutLabel}
            </p>
            <h3 className="mt-1 text-2xl font-bold tabular-nums text-white">{formatRM(totals.net)}</h3>
            <p className="mt-1 text-xs text-gray-500">
              {entries.length} {t.payroll.entriesWord} · gross {formatRM(grossTotal)}
            </p>
          </div>
          {summaryCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${c.iconColor}`} />
                  </span>
                  <span className="text-[11px] text-gray-500">{c.label}</span>
                </div>
                <p className={`text-lg font-bold tabular-nums ${c.color}`}>{c.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main content */}
      {selectedPeriodId && (
        <div className="grid gap-6 xl:grid-cols-4">
          {/* Left — payroll table */}
          <div className="space-y-5 xl:col-span-3">
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a]">
              {/* Actions bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
                <h3 className="text-sm font-semibold text-white">{t.payroll.breakdownTitle}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPeriod?.status === "draft" && (
                    <>
                      <button
                        type="button"
                        onClick={handleGenerateAll}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> {t.payroll.generateAll}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("pending_review")}
                        disabled={pending}
                        className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
                      >
                        {t.payroll.submitReview}
                      </button>
                    </>
                  )}
                  {selectedPeriod?.status === "pending_review" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={pending}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {t.payroll.approve}
                    </button>
                  )}
                  {selectedPeriod?.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("paid")}
                      disabled={pending}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {t.payroll.markPaid}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setStatutoryHint(null);
                      setFormError(null);
                      setAddStaffId("");
                      setShowAddEntryModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t.payroll.addEntry}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                      <th className="w-8 p-2" />
                      <th className="px-4 py-3 text-left">{t.payroll.colStaff}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colDays}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colBase}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colSvcComm}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colProdComm}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colBonus}</th>
                      <th className="px-3 py-3 text-right">{t.payroll.colDeduct}</th>
                      <th className="px-3 py-3 text-right font-semibold">{t.payroll.colNet}</th>
                      <th className="w-24 px-3 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center">
                          <Users className="mx-auto mb-3 h-8 w-8 text-gray-700" />
                          <p className="text-sm text-gray-500">{t.payroll.noEntries}</p>
                          {selectedPeriod?.status === "draft" && (
                            <p className="mt-1 text-xs text-gray-600">
                              Use &quot;{t.payroll.generateAll}&quot; to auto-fill from POS data.
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      entries.map((e) => {
                        const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
                        const stat = calculateStatutoryDeductions(gross);
                        const diff = Math.round((e.deductions - stat.totalEmployeeDeductions) * 100) / 100;
                        const daysLabel =
                          e.days_worked != null && e.total_working_days != null
                            ? `${e.days_worked}/${e.total_working_days}`
                            : "—";
                        const expanded = expandedEntryId === e.id;
                        return (
                          <Fragment key={e.id}>
                            <tr className={`border-t border-white/[0.04] transition ${expanded ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"}`}>
                              <td className="p-2 pl-3">
                                <button
                                  type="button"
                                  onClick={() => setExpandedEntryId(expanded ? null : e.id)}
                                  className="rounded p-1 text-gray-600 transition hover:bg-white/5 hover:text-white"
                                  aria-label={expanded ? "Collapse" : "Expand"}
                                >
                                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => setPayslipEntry(e)}
                                  className="group flex items-center gap-2.5 text-left"
                                  title="View payslip"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#222] text-[11px] font-bold text-gray-300 ring-0 transition group-hover:ring-2 group-hover:ring-[#D4AF37]/50">
                                    {getInitials(e.staff?.full_name ?? "?")}
                                  </div>
                                  <span className="font-medium text-white underline-offset-2 transition group-hover:text-[#D4AF37] group-hover:underline">
                                    {e.staff?.full_name ?? "Unknown"}
                                  </span>
                                </button>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-400">{daysLabel}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-gray-300">{formatRM(e.base_salary)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-emerald-400">{formatRM(e.service_commission)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-blue-400">{formatRM(e.product_commission)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-[#D4AF37]">{formatRM(e.bonuses)}</td>
                              <td className="px-3 py-3 text-right">
                                <span className="tabular-nums text-red-400">-{formatRM(e.deductions)}</span>
                                {Math.abs(diff) > 0.5 && (
                                  <span
                                    className={`ml-1 text-[9px] font-semibold ${diff > 0 ? "text-orange-400" : "text-sky-400"}`}
                                    title={diff > 0 ? "Above statutory" : "Below statutory"}
                                  >
                                    {diff > 0 ? "▲" : "▼"}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right font-bold tabular-nums text-white">{formatRM(e.net_payout)}</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => printPayslip(e)}
                                    className="rounded-md p-1.5 text-gray-600 transition hover:bg-white/5 hover:text-[#D4AF37]"
                                    title="Print payslip"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>
                                  {selectedPeriod?.status === "draft" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingEntry(e);
                                          setFormError(null);
                                          setShowEditEntryModal(true);
                                        }}
                                        className="rounded-md p-1.5 text-gray-600 transition hover:bg-white/5 hover:text-white"
                                        title="Edit"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEntry(e.id)}
                                        className="rounded-md p-1.5 text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expanded && (
                              <tr className="border-t border-white/[0.03]">
                                <td colSpan={10} className="bg-[#111]/60 px-6 py-4">
                                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/80">
                                    {t.payroll.posCommissionDetail}
                                  </p>
                                  <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="text-xs">
                                      <span className="text-gray-500">{t.payroll.serviceRevenue}</span>
                                      <p className="font-medium text-white">{formatRM(e.service_revenue ?? 0)}</p>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">{t.payroll.productRevenue}</span>
                                      <p className="font-medium text-white">{formatRM(e.product_revenue ?? 0)}</p>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">{t.payroll.servicesCount}</span>
                                      <p className="font-medium text-white">{e.services_count ?? "—"}</p>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-gray-500">{t.payroll.customersServed}</span>
                                      <p className="font-medium text-white">{e.customers_served ?? "—"}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-gray-600">
                                    Statutory est.: EPF {formatRM(stat.epf.employeeContribution)}, SOCSO {formatRM(stat.socso.employeeContribution)}, EIS {formatRM(stat.eis.employeeContribution)}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Period info */}
            {selectedPeriod && (
              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t.payroll.paymentSchedule}
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-600" />
                    <span className="text-gray-400">{t.payroll.periodLabel}</span>
                    <span className="ml-auto font-medium text-white">
                      {formatDate(selectedPeriod.period_start)} – {formatDate(selectedPeriod.period_end)}
                    </span>
                  </div>
                  {selectedPeriod.payout_due_date && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-gray-400">{t.payroll.dueLabel}</span>
                      <span className="ml-auto font-medium text-white">{formatDate(selectedPeriod.payout_due_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3.5 w-3.5 text-gray-600" />
                    <span className="text-gray-400">{t.payroll.entriesCount}</span>
                    <span className="ml-auto font-medium text-white">{entries.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gray-600" />
                    <span className="text-gray-400">{t.payroll.avgDaysWorked}</span>
                    <span className="ml-auto font-medium text-white">{avgDaysWorked.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top earners */}
            {entries.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t.payroll.topEarners}
                </h4>
                <div className="space-y-3">
                  {topEarners.map((e) => (
                    <div key={`${e.rank}-${e.name}`} className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${
                          e.rank === 1
                            ? "border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"
                            : "bg-[#222] text-gray-400"
                        }`}>
                          {e.init}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{e.name}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold tabular-nums ${e.rank === 1 ? "text-[#D4AF37]" : "text-gray-300"}`}>
                        {e.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employer statutory */}
            {entries.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t.payroll.employerStatutory}
                </h4>
                <p className="mb-3 text-[10px] text-gray-600">{t.payroll.employerStatutoryNote}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.payroll.epfEmployer}</span>
                    <span className="tabular-nums text-white">{formatRM(totals.employerEpf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.payroll.socsoEmployer}</span>
                    <span className="tabular-nums text-white">{formatRM(totals.employerSocso)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.payroll.eisEmployer}</span>
                    <span className="tabular-nums text-white">{formatRM(totals.employerEis)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 font-semibold">
                    <span className="text-white">{t.payroll.totalEmployerCost}</span>
                    <span className="tabular-nums text-orange-400">{formatRM(totals.totalEmployerCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t.payroll.notesTitle}
              </h4>
              <ul className="space-y-2.5 text-[11px] leading-relaxed text-gray-500">
                <li className="flex gap-2">
                  <FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-700" />
                  {t.payroll.noteCommissions}
                </li>
                <li className="flex gap-2">
                  <FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-700" />
                  {t.payroll.noteGenerate}
                </li>
                <li className="flex gap-2">
                  <FileText className="mt-0.5 h-3 w-3 shrink-0 text-gray-700" />
                  {t.payroll.noteStatutory}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* New period modal */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t.payroll.modalNewPeriod}</h3>
              <button type="button" onClick={() => setShowNewPeriodModal(false)} className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleNewPeriod} className="space-y-4">
              {formError && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.periodStart}</label>
                <input name="period_start" type="date" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.periodEnd}</label>
                <input name="period_end" type="date" required className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.branchOptional}</label>
                <select name="branch_id" className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">{t.payroll.allBranches}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowNewPeriodModal(false)} className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">{t.payroll.cancel}</button>
                <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50">{pending ? t.payroll.creating : t.payroll.createPeriod}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add entry modal */}
      {showAddEntryModal && selectedPeriodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t.payroll.modalAddEntry}</h3>
              <button type="button" onClick={() => { setShowAddEntryModal(false); setAddStaffId(""); }} className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form ref={entryFormRef} onSubmit={handleAddEntry} className="space-y-4">
              {formError && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.colStaff}</label>
                <select name="staff_id" required value={addStaffId} onChange={(ev) => setAddStaffId(ev.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">{t.payroll.selectStaff}</option>
                  {staffList.map((s) => <option key={s.id} value={s.staff_profile_id}>{s.full_name}</option>)}
                </select>
              </div>

              {addStaffId && commissionPreview && (
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 text-xs text-gray-300">
                  <p className="mb-2 font-semibold text-[#D4AF37]">{t.payroll.commissionFromPos}</p>
                  {commissionLoading && <p className="text-gray-500">{t.payroll.loadingCalc}</p>}
                  <div className="grid grid-cols-2 gap-1.5">
                    <p>{t.payroll.serviceRevenue}: <span className="text-white">{formatRM(commissionPreview.serviceRevenue)}</span></p>
                    <p>{t.payroll.svcComm}: <span className="text-emerald-400">{formatRM(commissionPreview.serviceCommission)}</span></p>
                    <p>{t.payroll.productRevenue}: <span className="text-white">{formatRM(commissionPreview.productRevenue)}</span></p>
                    <p>{t.payroll.prodComm}: <span className="text-blue-400">{formatRM(commissionPreview.productCommission)}</span></p>
                    <p>{t.payroll.servicesCount}: <span className="text-white">{commissionPreview.servicesCount}</span></p>
                    <p>{t.payroll.schemeLabel}: <span className="text-white">{commissionPreview.schemeName ?? t.payroll.noScheme}</span></p>
                  </div>
                </div>
              )}

              <input type="hidden" name="base_salary" value={String(selectedStaffBase)} />
              <input type="hidden" name="service_commission" value={String(commissionPreview?.serviceCommission ?? 0)} />
              <input type="hidden" name="product_commission" value={String(commissionPreview?.productCommission ?? 0)} />
              <input type="hidden" name="days_worked" value={String(attPreview?.daysWorked ?? 0)} />
              <input type="hidden" name="total_working_days" value={String(attPreview?.totalWorkingDays ?? 0)} />
              <input type="hidden" name="service_revenue" value={String(commissionPreview?.serviceRevenue ?? 0)} />
              <input type="hidden" name="product_revenue" value={String(commissionPreview?.productRevenue ?? 0)} />
              <input type="hidden" name="services_count" value={String(commissionPreview?.servicesCount ?? 0)} />
              <input type="hidden" name="customers_served" value={String(commissionPreview?.customersServed ?? 0)} />

              {addStaffId && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/5 bg-[#111] p-3 text-xs">
                  <div><span className="text-gray-500">{t.payroll.previewBase}</span><p className="font-medium text-white">{formatRM(selectedStaffBase)}</p></div>
                  <div><span className="text-gray-500">{t.payroll.previewSvc}</span><p className="font-medium text-emerald-400">{formatRM(commissionPreview?.serviceCommission ?? 0)}</p></div>
                  <div><span className="text-gray-500">{t.payroll.previewProd}</span><p className="font-medium text-blue-400">{formatRM(commissionPreview?.productCommission ?? 0)}</p></div>
                  <div><span className="text-gray-500">{t.payroll.previewDays}</span><p className="font-medium text-white">{attPreview?.daysWorked ?? 0} / {attPreview?.totalWorkingDays ?? 0}</p></div>
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-[#111]/50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">{t.payroll.statutoryBlock}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.age}</label>
                    <input name="statutory_age" type="number" min={16} max={100} defaultValue={30} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.marital}</label>
                    <select name="marital_status" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                      <option value="single">Single / divorced / widowed</option>
                      <option value="married_spouse_no_income">Married, spouse not working</option>
                      <option value="married_spouse_income">Married, spouse has income</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.children}</label>
                    <input name="num_dependents" type="number" min={0} max={20} defaultValue={0} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
                <button type="button" onClick={() => applyStatutoryToForm(entryFormRef)} className="mt-3 w-full rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20">{t.payroll.applyStatutory}</button>
                {statutoryHint && <p className="mt-2 text-[10px] leading-relaxed text-gray-500">{statutoryHint}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.bonuses}</label>
                  <input name="bonuses" type="number" step="0.01" defaultValue="0" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.deductions}</label>
                  <input name="deductions" type="number" step="0.01" defaultValue="0" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.advances}</label>
                  <input name="advances" type="number" step="0.01" defaultValue="0" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.notesOptional}</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder={t.payroll.notesPlaceholder} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddEntryModal(false); setAddStaffId(""); }} className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">{t.payroll.cancel}</button>
                <button type="submit" disabled={pending || !addStaffId || commissionLoading} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50">{pending ? t.payroll.adding : t.payroll.addEntryBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit entry modal */}
      {showEditEntryModal && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t.payroll.modalEditEntry}</h3>
              <button type="button" onClick={() => { setShowEditEntryModal(false); setEditingEntry(null); }} className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form ref={editFormRef} key={editingEntry.id} onSubmit={handleEditEntry} className="space-y-4">
              {formError && <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>}
              <p className="text-sm font-medium text-white">{editingEntry.staff?.full_name}</p>
              <input type="hidden" name="service_revenue" value={String(editingEntry.service_revenue ?? 0)} />
              <input type="hidden" name="product_revenue" value={String(editingEntry.product_revenue ?? 0)} />
              <input type="hidden" name="services_count" value={String(editingEntry.services_count ?? 0)} />
              <input type="hidden" name="customers_served" value={String(editingEntry.customers_served ?? 0)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.colBase}</label>
                  <input name="base_salary" type="number" step="0.01" defaultValue={editingEntry.base_salary} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.colSvcComm}</label>
                  <input name="service_commission" type="number" step="0.01" defaultValue={editingEntry.service_commission} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.colProdComm}</label>
                  <input name="product_commission" type="number" step="0.01" defaultValue={editingEntry.product_commission} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.bonuses}</label>
                  <input name="bonuses" type="number" step="0.01" defaultValue={editingEntry.bonuses} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.deductions}</label>
                  <input name="deductions" type="number" step="0.01" defaultValue={editingEntry.deductions} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.advances}</label>
                  <input name="advances" type="number" step="0.01" defaultValue={editingEntry.advances} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.colDays}</label>
                  <input name="days_worked" type="number" defaultValue={editingEntry.days_worked ?? ""} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.totalWorkingDays}</label>
                  <input name="total_working_days" type="number" defaultValue={editingEntry.total_working_days ?? ""} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.payroll.notesOptional}</label>
                <textarea name="notes" rows={2} defaultValue={editingEntry.notes ?? ""} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div className="rounded-lg border border-white/10 bg-[#111]/50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">{t.payroll.statutoryBlock}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.age}</label>
                    <input name="statutory_age" type="number" min={16} max={100} defaultValue={30} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.marital}</label>
                    <select name="marital_status" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                      <option value="single">Single / divorced / widowed</option>
                      <option value="married_spouse_no_income">Married, spouse not working</option>
                      <option value="married_spouse_income">Married, spouse has income</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-gray-500">{t.payroll.children}</label>
                    <input name="num_dependents" type="number" min={0} max={20} defaultValue={0} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
                <button type="button" onClick={() => applyStatutoryToForm(editFormRef)} className="mt-3 w-full rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20">{t.payroll.applyStatutory}</button>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowEditEntryModal(false); setEditingEntry(null); }} className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">{t.payroll.cancel}</button>
                <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50">{pending ? t.payroll.saving : t.payroll.saveEntry}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Payslip detail modal ─────────────────────────────────────── */}
      {payslipEntry && selectedPeriod && (() => {
        const e = payslipEntry;
        const gross = e.base_salary + e.service_commission + e.product_commission + e.bonuses;
        const stat = calculateStatutoryDeductions(gross, 30, { maritalStatus: "single", numDependents: 0 });
        const diff = Math.round((e.deductions - stat.totalEmployeeDeductions) * 100) / 100;
        const periodLabel = `${formatDate(selectedPeriod.period_start)} – ${formatDate(selectedPeriod.period_end)}`;
        const rev = (e.service_revenue ?? 0) + (e.product_revenue ?? 0);
        const daysLabel = e.days_worked != null && e.total_working_days != null
          ? `${e.days_worked} / ${e.total_working_days} days`
          : "—";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-2xl">
              {/* Header */}
              <div className="flex shrink-0 items-start justify-between border-b border-white/5 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-base font-bold text-[#D4AF37]">
                    {getInitials(e.staff?.full_name ?? "?")}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{e.staff?.full_name ?? "Staff"}</h2>
                    <p className="text-xs text-gray-500">{tenantName} · {periodLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printPayslip(e)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayslipEntry(null)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Net payout hero */}
                <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/70">Net Payout</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-white">{formatRM(e.net_payout)}</p>
                    <p className="mt-1 text-xs text-gray-500">{daysLabel} · {e.services_count ?? 0} services · {e.customers_served ?? 0} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-500">POS Revenue</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-sky-300">{formatRM(rev)}</p>
                  </div>
                </div>

                {/* Earnings */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Earnings</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      { label: "Base salary", value: e.base_salary, color: "text-gray-200" },
                      { label: "Service commission", value: e.service_commission, color: "text-emerald-400" },
                      { label: "Product commission", value: e.product_commission, color: "text-blue-400" },
                      { label: "Bonuses", value: e.bonuses, color: "text-[#D4AF37]" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-400">{row.label}</span>
                        <span className={`tabular-nums font-medium ${row.color}`}>{formatRM(row.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-white/[0.03] px-4 py-3 text-sm font-semibold">
                      <span className="text-white">Gross pay</span>
                      <span className="tabular-nums text-white">{formatRM(gross)}</span>
                    </div>
                  </div>
                </div>

                {/* POS breakdown */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <ShoppingBag className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">POS / Transaction Detail</h3>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-white/[0.04] divide-y divide-white/[0.04] sm:grid-cols-4">
                    {[
                      { label: "Service revenue", value: formatRM(e.service_revenue ?? 0), color: "text-emerald-400" },
                      { label: "Product revenue", value: formatRM(e.product_revenue ?? 0), color: "text-blue-400" },
                      { label: "Services", value: String(e.services_count ?? "—"), color: "text-white" },
                      { label: "Customers", value: String(e.customers_served ?? "—"), color: "text-white" },
                    ].map((c) => (
                      <div key={c.label} className="px-4 py-3 text-center">
                        <p className={`text-base font-bold tabular-nums ${c.color}`}>{c.value}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">{c.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <LayoutList className="h-4 w-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-white">Statutory Estimate (KWSP / PERKESO / SIP / PCB)</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      { label: "EPF — employee (11%)", value: stat.epf.employeeContribution },
                      { label: "SOCSO — employee", value: stat.socso.employeeContribution },
                      { label: "EIS — employee", value: stat.eis.employeeContribution },
                      { label: "PCB / MTD (estimate)", value: stat.pcb.monthlyPcb },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="tabular-nums text-red-400">- {formatRM(row.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-white/[0.03] px-4 py-3 text-sm font-semibold">
                      <span className="text-gray-300">Total statutory est.</span>
                      <span className="tabular-nums text-red-400">- {formatRM(stat.totalEmployeeDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Recorded in BarberPro */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <h3 className="text-sm font-semibold text-white">Recorded in BarberPro</h3>
                    {Math.abs(diff) > 0.5 && (
                      <span className={`text-xs font-semibold ${diff > 0 ? "text-orange-400" : "text-sky-400"}`}>
                        {diff > 0 ? "▲" : "▼"} {formatRM(Math.abs(diff))} vs statutory est.
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-400">Total deductions (stored)</span>
                      <span className="tabular-nums text-red-400">- {formatRM(e.deductions)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-400">Advances</span>
                      <span className="tabular-nums text-orange-300">- {formatRM(e.advances)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/[0.03] px-4 py-3 text-base font-bold">
                      <span className="text-white">Net payout</span>
                      <span className="tabular-nums text-[#D4AF37]">{formatRM(e.net_payout)}</span>
                    </div>
                  </div>
                </div>

                {/* Employer side */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <Banknote className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Employer Contributions (estimate)</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      { label: "EPF — employer", value: stat.epf.employerContribution },
                      { label: "SOCSO — employer", value: stat.socso.employerContribution },
                      { label: "EIS — employer", value: stat.eis.employerContribution },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="tabular-nums text-orange-300">{formatRM(row.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-white/[0.03] px-4 py-3 text-sm font-semibold">
                      <span className="text-gray-300">Total employer cost</span>
                      <span className="tabular-nums text-orange-400">{formatRM(stat.totalEmployerCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {e.notes && (
                  <div className="rounded-xl border border-white/5 bg-[#1a1a1a] px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Notes</p>
                    <p className="text-sm text-gray-300">{e.notes}</p>
                  </div>
                )}

                {/* Legal disclaimer */}
                <p className="text-[10px] leading-relaxed text-gray-600">
                  Statutory estimates use a simplified MTD model (age 30, single, 0 dependents). Confirm with LHDN tables, EA form, and e‑Data PCB before filing. Deductions stored in BarberPro may differ from the statutory estimate if loans, zakat, or custom PCB inputs apply. This payslip is for records only and is not legal or tax advice.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
