"use client";

import {
  Banknote,
  ChevronDown,
  CircleDollarSign,
  Gift,
  Minus,
  Percent,
  Save,
  Scissors,
  ShoppingBag,
  Target,
  TrendingUp,
  User,
  Users
} from "lucide-react";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const PAYROLL_TYPES = [
  { id: "fixed", name: "Fixed Salary", desc: "Monthly fixed amount", icon: Banknote, active: false },
  { id: "customer", name: "Per Customer", desc: "Pay per customer served", icon: User, active: false },
  { id: "service", name: "Per Service", desc: "Fixed rate per service", icon: Scissors, active: false },
  { id: "pct-service", name: "% of Service", desc: "Percentage of service revenue", icon: Percent, active: true },
  { id: "pct-product", name: "% of Products", desc: "Percentage of product sales", icon: ShoppingBag, active: false },
  { id: "hybrid", name: "Hybrid Model", desc: "Base + commissions + bonus", icon: TrendingUp, active: false }
];

const COMMISSION_RULES = [
  { service: "Premium Cut + Shave", rate: "15%", amount: "RM 9.75" },
  { service: "Basic Haircut", rate: "15%", amount: "RM 5.25" },
  { service: "Hair Coloring", rate: "12%", amount: "RM 14.40" },
  { service: "Kids Cut", rate: "15%", amount: "RM 3.75" },
  { service: "Beard Trim", rate: "15%", amount: "RM 3.00" },
  { service: "Hair Treatment", rate: "12%", amount: "RM 9.60" }
];

const PREVIEW = {
  base: "RM 2,200",
  serviceComm: "RM 1,450",
  productComm: "RM 280",
  bonus: "RM 300",
  deductions: "RM 180",
  net: "RM 4,050"
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export default function CommissionsPage() {
  const [selectedType, setSelectedType] = useState("pct-service");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Staff Commission Setup</h1>
          <p className="mt-1 text-sm text-gray-400">Configure payroll type, commission rates and bonuses</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Staff & branch selector */}
          <Card className="p-5">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-[#D4AF37]" /> Staff &amp; Branch Selection</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Staff Member</label>
                <button type="button" className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2a2a] text-[10px] font-bold text-white">MZ</span>
                    Muhammad Zack
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Branch</label>
                <button type="button" className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white">
                  KL Sentral HQ
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </Card>

          {/* Payroll type */}
          <Card className="p-5">
            <h2 className="font-bold text-white mb-4">Payroll Type</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PAYROLL_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selectedType === t.id
                        ? "border-[#D4AF37]/40 bg-[#D4AF37]/10"
                        : "border-white/5 bg-[#111] hover:border-[#D4AF37]/20"
                    }`}
                  >
                    <Icon className={`mb-2 h-5 w-5 ${selectedType === t.id ? "text-[#D4AF37]" : "text-gray-500"}`} />
                    <h3 className="text-sm font-bold text-white mb-1">{t.name}</h3>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Commission rules */}
          <Card className="p-5">
            <h2 className="font-bold text-white mb-4">Commission Rules</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="pb-3 text-left">Service</th>
                    <th className="pb-3 text-right">Rate</th>
                    <th className="pb-3 text-right">Est. per Service</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMISSION_RULES.map((r) => (
                    <tr key={r.service} className="border-t border-white/[0.04]">
                      <td className="py-3 text-white">{r.service}</td>
                      <td className="py-3 text-right">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">{r.rate}</span>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-300">{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Target bonuses */}
          <Card className="p-5">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-[#D4AF37]" /> Target Bonuses</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-[#111] p-4">
                <h3 className="text-sm font-bold text-white mb-1">Monthly Customer Target</h3>
                <p className="text-xs text-gray-500 mb-3">Bonus when reaching customer goal</p>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500">Target</label>
                    <input type="text" defaultValue="150" className="block w-20 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Bonus</label>
                    <input type="text" defaultValue="RM 300" className="block w-24 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-sm text-white" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#111] p-4">
                <h3 className="text-sm font-bold text-white mb-1">Revenue Milestone</h3>
                <p className="text-xs text-gray-500 mb-3">Bonus when revenue target is met</p>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500">Target</label>
                    <input type="text" defaultValue="RM 10,000" className="block w-24 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Bonus</label>
                    <input type="text" defaultValue="RM 500" className="block w-24 rounded border border-white/10 bg-[#1a1a1a] px-2 py-1 text-sm text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Deductions */}
          <Card className="p-5">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Minus className="h-4 w-4 text-red-400" /> Deductions &amp; Adjustments</h2>
            <div className="space-y-3">
              {[
                { name: "EPF (Employee)", pct: "11%", amount: "RM 242" },
                { name: "SOCSO", pct: "0.5%", amount: "RM 11" },
                { name: "Uniform deduction", pct: "-", amount: "RM 50" }
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-lg bg-[#111] px-4 py-3 text-sm">
                  <span className="text-gray-300">{d.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{d.pct}</span>
                    <span className="font-bold text-red-400">{d.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right panel - Earnings preview */}
        <div className="space-y-6">
          <Card className="sticky top-24 p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Gift className="h-4 w-4 text-[#D4AF37]" /> Earnings Preview</h3>
            <p className="text-xs text-gray-500 mb-4">Estimated earnings for Muhammad Zack based on current configuration</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Base Salary</span><span className="text-white">{PREVIEW.base}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Service Commission</span><span className="text-emerald-400">{PREVIEW.serviceComm}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Product Commission</span><span className="text-blue-400">{PREVIEW.productComm}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Bonus</span><span className="text-[#D4AF37]">{PREVIEW.bonus}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Deductions</span><span className="text-red-400">- {PREVIEW.deductions}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-3 font-bold">
                <span className="text-white">Net Payout</span>
                <span className="text-[#D4AF37] text-lg">{PREVIEW.net}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
              <p className="text-xs text-[#D4AF37]">This is an estimate based on last month&apos;s performance. Actual payout may vary.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
