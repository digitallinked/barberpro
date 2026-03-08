"use client";

import {
  CheckCircle2,
  Clock,
  MoveRight,
  Scissors,
  Timer,
  UserCheck,
  UserRound,
  Users,
  XCircle
} from "lucide-react";
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Waiting", value: "8", hint: "~35 min avg wait", icon: Timer, iconBg: "bg-orange-500/10", iconColor: "text-orange-400" },
  { label: "In Service", value: "5", hint: "Currently serving", icon: UserCheck, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { label: "Completed", value: "23", hint: "Today so far", icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { label: "Available", value: "3", hint: "Barbers ready", icon: UserRound, iconBg: "bg-purple-500/10", iconColor: "text-purple-400" }
];

const TABS = [
  { label: "All", count: 13 },
  { label: "Waiting", count: 8 },
  { label: "Assigned", count: 5 },
  { label: "In Service", count: 5 },
  { label: "Completed", count: 23 },
  { label: "Cancelled", count: 2 }
];

type QueueEntry = {
  code: string;
  name: string;
  phone: string;
  services: string[];
  status: "waiting" | "in-service";
  preferred: string | null;
  barber: string | null;
  started?: string;
  timer: string;
  timerLabel: string;
};

const QUEUE: QueueEntry[] = [
  { code: "Q1", name: "Ahmad Fauzi", phone: "+6012-345-6789", services: ["Premium Cut", "Hot Towel Shave"], status: "waiting", preferred: "Sam", barber: null, timer: "25:14", timerLabel: "waiting time" },
  { code: "Q2", name: "Tan Wei Liang", phone: "+6019-876-5432", services: ["Basic Cut"], status: "in-service", preferred: null, barber: "Sam", started: "14:15", timer: "20:00", timerLabel: "in service" },
  { code: "Q3", name: "Kumar s/o Rajan", phone: "+6016-234-8901", services: ["Kids Cut", "Hair Wash"], status: "waiting", preferred: null, barber: null, timer: "18:45", timerLabel: "waiting time" },
  { code: "Q4", name: "Jason Lee", phone: "+6012-567-8901", services: ["Hair Coloring"], status: "in-service", preferred: null, barber: "Zack", started: "13:45", timer: "50:00", timerLabel: "in service" },
  { code: "Q5", name: "Walk-in Guest", phone: "No phone", services: ["Basic Cut"], status: "waiting", preferred: null, barber: null, timer: "12:30", timerLabel: "waiting time" },
  { code: "Q6", name: "Hafiz Rahman", phone: "+6013-456-7890", services: ["Premium Cut", "Beard Trim"], status: "waiting", preferred: "Ali", barber: null, timer: "08:20", timerLabel: "waiting time" }
];

type Barber = {
  name: string;
  init: string;
  role: string;
  status: "available" | "busy" | "break";
  info: string;
  metric: string;
  metricColor: string;
};

const BARBERS: Barber[] = [
  { name: "Sam", init: "S", role: "Senior Barber", status: "available", info: "Today: 8 customers", metric: "RM 450", metricColor: "text-emerald-400" },
  { name: "Zack", init: "Z", role: "Barber", status: "busy", info: "Serving: Jason Lee", metric: "50 min", metricColor: "text-red-400" },
  { name: "Ali", init: "A", role: "Barber", status: "available", info: "Today: 6 customers", metric: "RM 280", metricColor: "text-emerald-400" },
  { name: "Faiz", init: "F", role: "Junior Barber", status: "busy", info: "Serving: Tan Wei Liang", metric: "20 min", metricColor: "text-red-400" },
  { name: "Rina", init: "R", role: "Barber", status: "break", info: "Back at: 15:00", metric: "~15 min", metricColor: "text-yellow-400" },
  { name: "David", init: "D", role: "Barber", status: "available", info: "Today: 4 customers", metric: "RM 180", metricColor: "text-emerald-400" }
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

const statusBadge: Record<string, string> = {
  available: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  busy: "bg-red-500/10 border-red-500/30 text-red-400",
  break: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function QueuePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Walk-in Queue</h2>
          <p className="mt-1 text-sm text-gray-400">Manage walk-in customers and barber assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40">
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Queue Board</span>
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="text-2xl font-bold text-white">{s.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
            </Card>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === i
                ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                : "border border-white/5 bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            {t.label} <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Queue cards (2/3) */}
        <div className="space-y-4 xl:col-span-2">
          {QUEUE.map((q) => (
            <Card key={q.code} className="relative overflow-hidden">
              {/* Status banner */}
              {q.status === "waiting" && q.code === "Q1" && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#111]">
                  Next
                </div>
              )}
              {q.status === "in-service" && (
                <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-lg bg-blue-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <Clock className="h-3 w-3" /> In Service
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${
                      q.status === "in-service"
                        ? "border-2 border-blue-500 bg-[#2a2a2a] text-white"
                        : q.code === "Q1"
                          ? "bg-[#D4AF37] text-[#111] shadow-lg"
                          : "border border-white/10 bg-[#2a2a2a] text-gray-400"
                    }`}>
                      {q.code}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{q.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{q.phone}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {q.services.map((s) => (
                          <span key={s} className="rounded-md bg-[#111] border border-white/5 px-2 py-0.5 text-xs text-gray-300">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {q.preferred && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Preferred:</span>
                            <span className="text-[#D4AF37] font-medium">{q.preferred}</span>
                          </div>
                        )}
                        {q.barber && (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Barber:</span>
                              <span className="text-blue-400 font-medium">{q.barber}</span>
                            </div>
                            {q.started && <span className="text-gray-500">Started: {q.started}</span>}
                          </>
                        )}
                        {!q.preferred && !q.barber && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Preferred:</span>
                            <span className="text-gray-400">Any available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-bold mb-1 ${q.status === "in-service" ? "text-blue-500" : q.code === "Q1" ? "text-orange-500" : "text-gray-400"}`}>
                      {q.timer}
                    </p>
                    <p className="text-xs text-gray-500">{q.timerLabel}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  {q.status === "in-service" ? (
                    <>
                      <button type="button" className="rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/30">
                        <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />Mark Complete
                      </button>
                      <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition hover:text-white">Reassign</button>
                      <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:text-red-300">
                        <XCircle className="mr-1 inline h-3.5 w-3.5" />Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#111] transition hover:brightness-110">Assign Barber</button>
                      <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition hover:text-white">Edit</button>
                      <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:text-red-300">
                        <XCircle className="mr-1 inline h-3.5 w-3.5" />Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Barber Availability */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Barber Availability</h3>
              <button type="button" className="text-xs font-medium text-[#D4AF37] hover:text-[#D4AF37]/80">Manage</button>
            </div>
            <div className="space-y-3">
              {BARBERS.map((b) => (
                <div key={b.name} className={`rounded-lg border p-4 transition ${statusBadge[b.status]}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-bold text-white">
                      {b.init}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">{b.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge[b.status]}`}>
                          {b.status === "available" ? "Available" : b.status === "busy" ? "Serving" : "On Break"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{b.role}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">{b.info}</span>
                    <span className={`font-medium ${b.metricColor}`}>{b.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Now Serving */}
          <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Now Serving</h3>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-5xl font-black text-[#D4AF37]">Q2</p>
              <Users className="h-6 w-6 text-[#D4AF37]/60" />
            </div>
            <p className="mt-2 text-lg font-semibold text-white">Tan Wei Liang</p>
            <p className="text-sm text-gray-400 mt-1">Barber: Sam</p>
            <button type="button" className="mt-4 flex items-center gap-1 text-xs font-medium text-[#D4AF37] transition hover:text-[#D4AF37]/80">
              Open queue board <MoveRight className="h-3.5 w-3.5" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
