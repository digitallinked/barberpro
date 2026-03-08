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
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useQueueTickets,
  useQueueStats,
  useStaffMembers,
  useServices
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { createQueueTicket, updateQueueStatus } from "@/actions/queue";
import type { QueueTicketWithRelations } from "@/services/queue";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

const statusBadge: Record<string, string> = {
  available: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  busy: "bg-red-500/10 border-red-500/30 text-red-400",
  break: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
};

function formatWaitTime(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatServiceTime(calledAt: string): string {
  const called = new Date(calledAt);
  const now = new Date();
  const diffMs = now.getTime() - called.getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function QueuePage() {
  const queryClient = useQueryClient();
  const { branchId } = useTenant();
  const { data: ticketsData, isLoading: ticketsLoading } = useQueueTickets();
  const { data: statsData } = useQueueStats();
  const { data: staffData } = useStaffMembers();
  const { data: servicesData } = useServices();

  const tickets = ticketsData?.data ?? [];
  const stats = statsData?.data ?? { waiting: 0, inProgress: 0, completed: 0 };
  const staffMembers = staffData?.data ?? [];
  const services = servicesData?.data ?? [];

  const barbers = staffMembers.filter((s) =>
    /barber/i.test(s.role ?? "")
  );

  const activeTickets = tickets.filter((t) => !["completed", "cancelled"].includes(t.status));
  const inServiceIds = new Set(
    activeTickets.filter((t) => t.status === "in_service").map((t) => t.assigned_staff_id)
  );
  const barberStatus = barbers.map((b) => {
    const staffProfileId = b.staff_profile_id;
    const isBusy = activeTickets.some(
      (t) => t.assigned_staff_id === staffProfileId && t.status === "in_service"
    );
    const serving = activeTickets.find(
      (t) => t.assigned_staff_id === staffProfileId && t.status === "in_service"
    );
    return {
      ...b,
      status: isBusy ? "busy" : "available",
      servingCustomer: serving?.customer?.full_name ?? null
    };
  });
  const availableCount = barberStatus.filter((b) => b.status === "available").length;
  const busyStaffIds = new Set(
    activeTickets
      .filter((t) => t.status === "in_service" && t.assigned_staff_id)
      .map((t) => t.assigned_staff_id)
  );

  const [activeTab, setActiveTab] = useState(0);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<QueueTicketWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTickets =
    activeTab === 0
      ? activeTickets
      : activeTab === 1
        ? activeTickets.filter((t) => t.status === "waiting")
        : activeTab === 2
          ? activeTickets.filter((t) => t.status === "waiting" && t.assigned_staff_id)
          : activeTab === 3
            ? activeTickets.filter((t) => t.status === "in_service")
            : tickets.filter((t) => t.status === "completed");
  const tabCounts = [
    activeTickets.length,
    activeTickets.filter((t) => t.status === "waiting").length,
    activeTickets.filter((t) => t.status === "waiting" && t.assigned_staff_id).length,
    activeTickets.filter((t) => t.status === "in_service").length,
    tickets.filter((t) => t.status === "completed").length,
    tickets.filter((t) => t.status === "cancelled").length
  ];
  const tabLabels = ["All", "Waiting", "Assigned", "In Service", "Completed", "Cancelled"];

  const nowServing = activeTickets.find((t) => t.status === "in_service");
  const queueBoardHref = branchId ? `/queue-board?branch=${branchId}` : "/queue-board";

  async function handleCreateTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!branchId) return;
    setFormError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("branch_id", branchId);
    const result = await createQueueTicket(formData);
    setSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      setShowNewModal(false);
      form.reset();
    } else {
      setFormError(result.error ?? "Failed to create ticket");
    }
  }

  async function handleUpdateStatus(
    ticketId: string,
    status: string,
    assignedStaffId?: string
  ) {
    const result = await updateQueueStatus(ticketId, status, assignedStaffId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      setShowAssignModal(null);
    }
  }

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-400">
        <p>Please select a branch to manage the queue.</p>
      </div>
    );
  }

  const STATS = [
    {
      label: "Waiting",
      value: String(stats.waiting),
      hint: "In queue",
      icon: Timer,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400"
    },
    {
      label: "In Service",
      value: String(stats.inProgress),
      hint: "Currently serving",
      icon: UserCheck,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400"
    },
    {
      label: "Completed",
      value: String(stats.completed),
      hint: "Total completed",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400"
    },
    {
      label: "Available",
      value: String(availableCount),
      hint: "Barbers ready",
      icon: UserRound,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Walk-in Queue</h2>
          <p className="mt-1 text-sm text-gray-400">Manage walk-in customers and barber assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Scissors className="h-4 w-4" /> New Walk-in
          </button>
          <Link
            href={queueBoardHref}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40"
          >
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Queue Board</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}>
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white">{s.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === i
                ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                : "border border-white/5 bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            {label} <span className="ml-1 opacity-70">({tabCounts[i]})</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {ticketsLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-white/5 bg-[#1a1a1a] py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : (
            filteredTickets.map((q) => {
              const isNext = q.status === "waiting" && !activeTickets.some((t) => t.status === "in_service");
              const timer =
                q.status === "in_service" && q.called_at
                  ? formatServiceTime(q.called_at)
                  : formatWaitTime(q.created_at);
              const timerLabel = q.status === "in_service" ? "in service" : "waiting time";
              const preferredName = q.preferred_staff_id
                ? barbers.find((b) => b.staff_profile_id === q.preferred_staff_id)?.full_name ?? null
                : null;

              return (
                <Card key={q.id} className="relative overflow-hidden">
                  {q.status === "waiting" && isNext && (
                    <div className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#111]">
                      Next
                    </div>
                  )}
                  {q.status === "in_service" && (
                    <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-lg bg-blue-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      <Clock className="h-3 w-3" /> In Service
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${
                            q.status === "in_service"
                              ? "border-2 border-blue-500 bg-[#2a2a2a] text-white"
                              : isNext
                                ? "bg-[#D4AF37] text-[#111] shadow-lg"
                                : "border border-white/10 bg-[#2a2a2a] text-gray-400"
                          }`}
                        >
                          {q.queue_number}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {q.customer?.full_name ?? "Walk-in Guest"}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {q.customer?.phone ?? "No phone"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {q.service && (
                              <span className="rounded-md bg-[#111] border border-white/5 px-2 py-0.5 text-xs text-gray-300">
                                {q.service.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {preferredName && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Preferred:</span>
                                <span className="text-[#D4AF37] font-medium">{preferredName}</span>
                              </div>
                            )}
                            {q.assigned_staff && (
                              <>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">Barber:</span>
                                  <span className="text-blue-400 font-medium">{q.assigned_staff.full_name}</span>
                                </div>
                                {q.called_at && (
                                  <span className="text-gray-500">
                                    Started: {new Date(q.called_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </>
                            )}
                            {!preferredName && !q.assigned_staff && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Preferred:</span>
                                <span className="text-gray-400">Any available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-2xl font-bold mb-1 ${
                            q.status === "in_service"
                              ? "text-blue-500"
                              : isNext
                                ? "text-orange-500"
                                : "text-gray-400"
                          }`}
                        >
                          {timer}
                        </p>
                        <p className="text-xs text-gray-500">{timerLabel}</p>
                      </div>
                    </div>

                    {!["completed", "cancelled"].includes(q.status) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                        {q.status === "in_service" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "completed")}
                              className="rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/30"
                            >
                              <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" /> Mark Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition hover:text-white"
                            >
                              Reassign
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3.5 w-3.5" /> Cancel
                            </button>
                          </>
                        ) : q.status === "waiting" && q.assigned_staff_id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "in_service")}
                              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#111] transition hover:brightness-110"
                            >
                              Start Service
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition hover:text-white"
                            >
                              Reassign
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3.5 w-3.5" /> Remove
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#111] transition hover:brightness-110"
                            >
                              Assign Barber
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3.5 w-3.5" /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Barber Availability</h3>
            </div>
            <div className="space-y-3">
              {barberStatus.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-lg border p-4 transition ${statusBadge[b.status]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-bold text-white">
                      {b.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">{b.full_name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge[b.status]}`}
                        >
                          {b.status === "available" ? "Available" : b.status === "busy" ? "Serving" : "On Break"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{b.role}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {b.servingCustomer ? `Serving: ${b.servingCustomer}` : `Today: ${b.role}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {nowServing && (
            <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Now Serving</h3>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-5xl font-black text-[#D4AF37]">{nowServing.queue_number}</p>
                <Users className="h-6 w-6 text-[#D4AF37]/60" />
              </div>
              <p className="mt-2 text-lg font-semibold text-white">
                {nowServing.customer?.full_name ?? "Walk-in Guest"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Barber: {nowServing.assigned_staff?.full_name ?? "—"}
              </p>
              <Link
                href={queueBoardHref}
                target="_blank"
                className="mt-4 flex items-center gap-1 text-xs font-medium text-[#D4AF37] transition hover:text-[#D4AF37]/80"
              >
                Open queue board <MoveRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* New Walk-in Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">New Walk-in</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Customer (optional)</label>
                <input
                  name="customer_search"
                  placeholder="Search by name or phone..."
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  readOnly
                />
                <input type="hidden" name="customer_id" id="customer_id" />
                <p className="mt-1 text-[10px] text-gray-500">Walk-in if left empty</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Service</label>
                <select
                  name="service_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Select service</option>
                  {services.filter((s) => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (RM {s.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Preferred Barber</label>
                <select
                  name="preferred_staff_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Any available</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.staff_profile_id}>
                      {b.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add to Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Barber Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Assign Barber</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              {showAssignModal.queue_number} – {showAssignModal.customer?.full_name ?? "Walk-in"}
            </p>
            <div className="space-y-2">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    const status = showAssignModal.status === "in_service" ? "in_service" : "waiting";
                    handleUpdateStatus(showAssignModal.id, status, b.staff_profile_id);
                    setShowAssignModal(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-[#111] p-3 text-left transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                    {b.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{b.full_name}</p>
                    <p className="text-xs text-gray-500">{b.role}</p>
                  </div>
                  {busyStaffIds.has(b.staff_profile_id) && (
                    <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400">
                      Busy
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
