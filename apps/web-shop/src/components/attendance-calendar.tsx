"use client";

import { useMemo } from "react";
import type { AttendanceWithStaff } from "@/services/attendance";
import type { StaffMember } from "@/services/staff";

const STATUS_CONFIG = {
  present: {
    label: "Present",
    symbol: "✓",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  late: {
    label: "Late",
    symbol: "⏱",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  half_day: {
    label: "Half Day",
    symbol: "½",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  absent: {
    label: "Absent",
    symbol: "✕",
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  leave: {
    label: "Leave",
    symbol: "L",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface AttendanceCalendarGridProps {
  attendanceRows: AttendanceWithStaff[];
  staffList: StaffMember[];
  dateFrom: string;
  dateTo: string;
  selectedStaffId?: string;
  selectedDate?: string;
  onCellClick: (staffId: string, staffName: string, date: string, currentStatus?: string) => void;
}

function getDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  const cur = new Date(start);
  while (cur <= end && dates.length < 62) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function AttendanceCalendarGrid({
  attendanceRows,
  staffList,
  dateFrom,
  dateTo,
  selectedStaffId,
  selectedDate,
  onCellClick,
}: AttendanceCalendarGridProps) {
  const dates = useMemo(() => getDates(dateFrom, dateTo), [dateFrom, dateTo]);

  const lookup = useMemo(() => {
    const map: Record<string, Record<string, AttendanceWithStaff>> = {};
    for (const r of attendanceRows) {
      if (!map[r.staff_id]) map[r.staff_id] = {};
      map[r.staff_id][r.date] = r;
    }
    return map;
  }, [attendanceRows]);

  if (staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-sm text-gray-500">No staff found for this branch.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: `${140 + dates.length * 32 + 5 * 44}px` }}>
          <thead>
            <tr className="border-b border-white/5 bg-[#141414]">
              <th
                className="sticky left-0 z-10 bg-[#141414] px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500"
                style={{ minWidth: 148 }}
              >
                Staff
              </th>
              {dates.map((d) => {
                const dayOfWeek = new Date(d + "T00:00:00").getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected = d === selectedDate;
                return (
                  <th
                    key={d}
                    className={`w-8 px-0 py-2 text-center font-medium transition-colors ${
                      isSelected
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : isWeekend
                        ? "text-gray-700"
                        : "text-gray-500"
                    }`}
                  >
                    <div className="text-[10px]">{d.slice(8)}</div>
                    <div className={`text-[9px] ${isWeekend && !isSelected ? "text-gray-800" : ""}`}>
                      {DAY_ABBR[dayOfWeek]}
                    </div>
                  </th>
                );
              })}
              <th className="w-11 border-l border-white/5 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                P
              </th>
              <th className="w-11 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-amber-500">
                L
              </th>
              <th className="w-11 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-blue-500">
                H
              </th>
              <th className="w-11 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-red-500">
                A
              </th>
              <th className="w-11 px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-purple-500">
                Lv
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {staffList.map((s) => {
              const staffRecords = lookup[s.staff_profile_id] ?? {};
              const isRowSelected = s.staff_profile_id === selectedStaffId;
              let present = 0,
                late = 0,
                halfDay = 0,
                absent = 0,
                leave = 0;

              for (const d of dates) {
                const r = staffRecords[d];
                if (r) {
                  if (r.status === "present") present++;
                  else if (r.status === "late") late++;
                  else if (r.status === "half_day") halfDay++;
                  else if (r.status === "absent") absent++;
                  else if (r.status === "leave") leave++;
                }
              }

              return (
                <tr
                  key={s.staff_profile_id}
                  className={`group transition-colors hover:bg-white/[0.02] ${isRowSelected ? "bg-[#D4AF37]/[0.03]" : ""}`}
                >
                  <td
                    className={`sticky left-0 z-10 px-4 py-1.5 transition-colors group-hover:bg-[#1d1d1d] ${
                      isRowSelected ? "bg-[#D4AF37]/[0.06] group-hover:bg-[#D4AF37]/[0.09]" : "bg-[#1a1a1a]"
                    }`}
                    style={{ minWidth: 148 }}
                  >
                    <p className="max-w-[136px] truncate font-medium text-white">{s.full_name}</p>
                    <p className="text-[9px] capitalize text-gray-600">{s.role.replace(/_/g, " ")}</p>
                  </td>
                  {dates.map((d) => {
                    const r = staffRecords[d];
                    const dayOfWeek = new Date(d + "T00:00:00").getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isCellSelected = isRowSelected && d === selectedDate;
                    const status = r?.status as StatusKey | undefined;
                    const cfg = status ? STATUS_CONFIG[status] : null;

                    return (
                      <td
                        key={d}
                        className={`w-8 px-0.5 py-1 text-center ${
                          isCellSelected ? "bg-[#D4AF37]/10" : isWeekend ? "bg-white/[0.01]" : ""
                        }`}
                      >
                        <button
                          type="button"
                          title={
                            cfg
                              ? `${s.full_name} · ${d}: ${cfg.label} — click to edit`
                              : `Log attendance for ${s.full_name} · ${d}`
                          }
                          onClick={() => onCellClick(s.staff_profile_id, s.full_name, d, r?.status)}
                          className={`mx-auto flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition hover:scale-110 hover:ring-1 hover:ring-[#D4AF37]/60 ${
                            isCellSelected
                              ? "ring-1 ring-[#D4AF37]/60"
                              : ""
                          } ${
                            cfg
                              ? `${cfg.bg} ${cfg.text} border ${cfg.border}`
                              : "text-gray-800 hover:bg-white/5"
                          }`}
                        >
                          {cfg ? cfg.symbol : "·"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="w-11 border-l border-white/5 px-1 py-1.5 text-center text-[11px] font-semibold">
                    {present > 0 ? (
                      <span className="text-emerald-400">{present}</span>
                    ) : (
                      <span className="text-gray-800">0</span>
                    )}
                  </td>
                  <td className="w-11 px-1 py-1.5 text-center text-[11px] font-semibold">
                    {late > 0 ? (
                      <span className="text-amber-400">{late}</span>
                    ) : (
                      <span className="text-gray-800">0</span>
                    )}
                  </td>
                  <td className="w-11 px-1 py-1.5 text-center text-[11px] font-semibold">
                    {halfDay > 0 ? (
                      <span className="text-blue-400">{halfDay}</span>
                    ) : (
                      <span className="text-gray-800">0</span>
                    )}
                  </td>
                  <td className="w-11 px-1 py-1.5 text-center text-[11px] font-semibold">
                    {absent > 0 ? (
                      <span className="text-red-400">{absent}</span>
                    ) : (
                      <span className="text-gray-800">0</span>
                    )}
                  </td>
                  <td className="w-11 px-1 py-1.5 text-center text-[11px] font-semibold">
                    {leave > 0 ? (
                      <span className="text-purple-400">{leave}</span>
                    ) : (
                      <span className="text-gray-800">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 px-4 py-3">
        {(Object.entries(STATUS_CONFIG) as [StatusKey, (typeof STATUS_CONFIG)[StatusKey]][]).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.symbol}
            </span>
            {cfg.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-white/5 text-[9px] text-gray-800">
            ·
          </span>
          Not logged
        </span>
        <span className="ml-auto text-[10px] text-gray-600">Click any cell to log attendance</span>
      </div>
    </div>
  );
}
