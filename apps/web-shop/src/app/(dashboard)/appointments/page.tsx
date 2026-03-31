"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck2,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  X
} from "lucide-react";
import {
  useAppointments,
  useCustomers,
  useServices,
  useStaffMembers,
  useBranches
} from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { useTenant } from "@/components/tenant-provider";
import { createAppointment, updateAppointmentStatus } from "@/actions/appointments";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_service: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  no_show: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { branchId, branches } = useTenant();
  const { data: appointmentsResult, isLoading: appointmentsLoading } = useAppointments();
  const { data: customersResult } = useCustomers();
  const { data: servicesResult } = useServices();
  const { data: staffResult } = useStaffMembers();
  const { data: branchesResult } = useBranches();

  const [showNewModal, setShowNewModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const appointmentsData = appointmentsResult?.data ?? [];
  const appointmentsError = appointmentsResult?.error;
  const customers = customersResult?.data ?? [];
  const services = servicesResult?.data ?? [];
  const staffMembers = staffResult?.data ?? [];
  const branchesData = branchesResult?.data ?? branches ?? [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const stats = {
    today: appointmentsData.filter((a) => {
      const t = new Date(a.start_at).getTime();
      return t >= todayStart.getTime() && t < todayEnd.getTime() && !["cancelled", "no_show"].includes(a.status);
    }).length,
    upcoming: appointmentsData.filter((a) => new Date(a.start_at) > now && !["cancelled", "no_show"].includes(a.status)).length,
    completed: appointmentsData.filter((a) => a.status === "completed").length,
    noShows: appointmentsData.filter((a) => a.status === "no_show").length,
  };

  let filtered = appointmentsData;
  if (dateFilter) {
    const [y, m, d] = dateFilter.split("-").map(Number);
    const filterStart = new Date(y!, m! - 1, d!);
    const filterEnd = new Date(filterStart);
    filterEnd.setDate(filterEnd.getDate() + 1);
    filtered = filtered.filter((a) => {
      const t = new Date(a.start_at).getTime();
      return t >= filterStart.getTime() && t < filterEnd.getTime();
    });
  }
  if (statusFilter) {
    filtered = filtered.filter((a) => a.status === statusFilter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.customer?.full_name?.toLowerCase().includes(q) ||
        a.service?.name?.toLowerCase().includes(q) ||
        a.barber?.full_name?.toLowerCase().includes(q)
    );
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const startDate = fd.get("start_date") as string;
    const startTime = fd.get("start_time") as string;
    const serviceId = fd.get("service_id") as string;
    const service = services.find((s) => s.id === serviceId);
    const durationMin = service?.duration_min ?? 30;
    const startAt = `${startDate}T${startTime}:00`;
    const endAt = new Date(new Date(startAt).getTime() + durationMin * 60 * 1000).toISOString().slice(0, 19);

    fd.set("start_at", startAt);
    fd.set("end_at", endAt);
    fd.set("branch_id", fd.get("branch_id") || branchId || branchesData[0]?.id || "");

    const result = await createAppointment(fd);
    setPending(false);
    if (result.success) {
      setShowNewModal(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } else {
      alert(result.error);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    setUpdatingId(id);
    const result = await updateAppointmentStatus(id, status);
    setUpdatingId(null);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } else {
      alert(result.error);
    }
  }

  const STATS = [
    { label: "Today's Appointments", value: stats.today, icon: CalendarCheck2, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { label: "Completed", value: stats.completed, icon: CalendarCheck2, iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
    { label: "No-Shows", value: stats.noShows, icon: X, iconBg: "bg-gray-500/10", iconColor: "text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.appointments.title}</h2>
          <p className="mt-1 text-sm text-gray-400">Manage booking schedules and appointments</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New Appointment
        </button>
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
              <h3 className="mt-2 text-2xl font-bold text-white">{appointmentsLoading ? "…" : s.value}</h3>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            <option value="">All statuses</option>
            <option value="booked">Booked</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_service">In Service</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search customer, service, barber..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Service</th>
                <th className="p-4 text-left">Barber</th>
                <th className="p-4 text-left">Date/Time</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Source</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : appointmentsError ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-400">Failed to load appointments</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No appointments found</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="p-4 font-medium text-white">{a.customer?.full_name ?? "—"}</td>
                    <td className="p-4 text-gray-300">{a.service?.name ?? "—"}</td>
                    <td className="p-4 text-gray-300">{a.barber?.full_name ?? "—"}</td>
                    <td className="p-4 text-gray-300">{formatDateTime(a.start_at)}</td>
                    <td className="p-4">
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold ${getStatusStyle(a.status)}`}>
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 capitalize">{a.source}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {a.status === "booked" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(a.id, "confirmed")}
                            disabled={!!updatingId}
                            className="rounded px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        {(a.status === "booked" || a.status === "confirmed") && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(a.id, "in_service")}
                            disabled={!!updatingId}
                            className="rounded px-2 py-0.5 text-xs text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50"
                          >
                            Start
                          </button>
                        )}
                        {a.status === "in_service" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(a.id, "completed")}
                            disabled={!!updatingId}
                            className="rounded px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                        {!["completed", "cancelled", "no_show"].includes(a.status) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(a.id, "cancelled")}
                              disabled={!!updatingId}
                              className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(a.id, "no_show")}
                              disabled={!!updatingId}
                              className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-500/10 disabled:opacity-50"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                        <button type="button" className="rounded p-1 text-gray-500 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
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
        </div>
      </Card>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">New Appointment</h3>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Customer *</label>
                <select name="customer_id" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Service *</label>
                <select name="service_id" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">Select service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (RM {s.price})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Barber</label>
                <select name="barber_staff_id" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="">Select barber</option>
                  {staffMembers.map((s) => (
                    <option key={s.staff_profile_id} value={s.staff_profile_id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Branch *</label>
                <select name="branch_id" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  {branchesData.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Date *</label>
                  <input name="start_date" type="date" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Start Time *</label>
                  <input name="start_time" type="time" required className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Source</label>
                <select name="source" className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="manual">Manual</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="Optional notes" />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
                >
                  {pending ? "Creating…" : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
