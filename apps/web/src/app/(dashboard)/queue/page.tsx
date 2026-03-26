"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  Armchair,
  MoveRight,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Scissors,
  Timer,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useQueueTickets,
  useQueueStats,
  useSeats,
  useStaffMembers,
  useServices
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import {
  cancelStaleWaitingQueueTickets,
  completeQueueTicketWithPayment,
  createQueueTicket,
  getQueueCheckinUrl,
  rotateQueueCheckinToken,
  updateQueueStatus
} from "@/actions/queue";
import { upsertSeat, deleteSeat, assignBarberToSeat, type BranchSeat } from "@/actions/seats";
import { formatShopDateLabel, formatShopTimeLabel } from "@/lib/shop-day";
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

function buildPosPaymentHref(ticket: QueueTicketWithRelations): string {
  const params = new URLSearchParams();
  params.set("queue_ticket_id", ticket.id);
  if (ticket.customer_id) params.set("customer_id", ticket.customer_id);
  if (ticket.service_id) params.set("service_id", ticket.service_id);
  if (ticket.assigned_staff_id) params.set("staff_id", ticket.assigned_staff_id);
  return `/pos?${params.toString()}`;
}

export default function QueuePage() {
  const queryClient = useQueryClient();
  const { branchId, branchName, tenantName } = useTenant();
  const { data: ticketsData, isLoading: ticketsLoading } = useQueueTickets();
  const { data: statsData } = useQueueStats();
  const { data: staffData } = useStaffMembers();
  const { data: servicesData } = useServices();
  const { data: seatsData, refetch: refetchSeats } = useSeats();

  const tickets = ticketsData?.data ?? [];
  const stats = statsData?.data ?? { waiting: 0, inProgress: 0, completed: 0 };
  const staffMembers = staffData?.data ?? [];
  const services = servicesData?.data ?? [];
  const activeServices = services.filter((s) => s.is_active);

  const barbers = staffMembers.filter((s) =>
    /barber/i.test(s.role ?? "")
  );

  const activeTickets = tickets.filter((t) => !["completed", "cancelled"].includes(t.status));

  const nextWaitingId = [...tickets]
    .filter((t) => t.status === "waiting")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.id;
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
  const [showPaymentModal, setShowPaymentModal] = useState<QueueTicketWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkinUrl, setCheckinUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [rotatingQr, setRotatingQr] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [staleSubmitting, setStaleSubmitting] = useState(false);
  // Seat management state
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [editingSeat, setEditingSeat] = useState<BranchSeat | null>(null);
  const [seatFormNumber, setSeatFormNumber] = useState("");
  const [seatFormLabel, setSeatFormLabel] = useState("");
  const [seatFormBarber, setSeatFormBarber] = useState("");
  const [seatFormSubmitting, setSeatFormSubmitting] = useState(false);
  const [seatFormError, setSeatFormError] = useState<string | null>(null);
  // Assign modal: selected barber + seat
  const [assignSelectedBarber, setAssignSelectedBarber] = useState<string>("");
  const [assignSelectedSeat, setAssignSelectedSeat] = useState<string>("");
  /** Avoid hydration mismatch: server vs client `new Date()` differ; show clock only after mount. */
  const [clockReady, setClockReady] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    setClock(new Date());
    setClockReady(true);
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredTickets =
    activeTab === 0
      ? tickets
      : activeTab === 1
        ? tickets.filter((t) => t.status === "waiting")
        : activeTab === 2
          ? tickets.filter((t) => t.status === "waiting" && t.assigned_staff_id)
          : activeTab === 3
            ? tickets.filter((t) => t.status === "in_service")
            : activeTab === 4
              ? tickets.filter((t) => t.status === "completed")
              : tickets.filter((t) => t.status === "cancelled");
  const tabCounts = [
    tickets.length,
    tickets.filter((t) => t.status === "waiting").length,
    tickets.filter((t) => t.status === "waiting" && t.assigned_staff_id).length,
    tickets.filter((t) => t.status === "in_service").length,
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
    assignedStaffId?: string,
    seatId?: string | null
  ) {
    const result = await updateQueueStatus(ticketId, status, assignedStaffId, seatId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      setShowAssignModal(null);
      setAssignSelectedBarber("");
      setAssignSelectedSeat("");
    }
  }

  async function handleSeatFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId) return;
    setSeatFormError(null);
    setSeatFormSubmitting(true);
    const result = await upsertSeat({
      id: editingSeat?.id,
      branchId,
      seatNumber: parseInt(seatFormNumber, 10),
      label: seatFormLabel,
      staffProfileId: seatFormBarber || null,
    });
    setSeatFormSubmitting(false);
    if (result.success) {
      void refetchSeats();
      setShowSeatForm(false);
      setEditingSeat(null);
      setSeatFormNumber("");
      setSeatFormLabel("");
      setSeatFormBarber("");
    } else {
      setSeatFormError(result.error ?? "Failed to save seat");
    }
  }

  function openNewSeatForm() {
    setEditingSeat(null);
    const seats = seatsData?.data ?? [];
    const nextNum = seats.length > 0 ? Math.max(...seats.map((s) => s.seat_number)) + 1 : 1;
    setSeatFormNumber(String(nextNum));
    setSeatFormLabel(`Seat ${nextNum}`);
    setSeatFormBarber("");
    setSeatFormError(null);
    setShowSeatForm(true);
  }

  function openEditSeatForm(seat: BranchSeat) {
    setEditingSeat(seat);
    setSeatFormNumber(String(seat.seat_number));
    setSeatFormLabel(seat.label || `Seat ${seat.seat_number}`);
    setSeatFormBarber(seat.staff_profile_id ?? "");
    setSeatFormError(null);
    setShowSeatForm(true);
  }

  async function handleDeleteSeat(seatId: string) {
    if (!confirm("Remove this seat? This cannot be undone.")) return;
    await deleteSeat(seatId);
    void refetchSeats();
  }

  async function handleAssignBarberToSeat(seatId: string, staffProfileId: string | null) {
    await assignBarberToSeat(seatId, staffProfileId);
    void refetchSeats();
  }

  async function openQrModal() {
    if (!branchId) return;
    setShowQrModal(true);
    setQrError(null);
    setCheckinUrl(null);
    setQrLoading(true);
    const result = await getQueueCheckinUrl(branchId);
    setQrLoading(false);
    if (result.success && typeof result.url === "string") setCheckinUrl(result.url);
    else setQrError(typeof result.error === "string" ? result.error : "Could not load QR link");
  }

  async function handleRotateQr() {
    if (!branchId) return;
    setShowRotateConfirm(false);
    setRotatingQr(true);
    setQrError(null);
    const result = await rotateQueueCheckinToken(branchId);
    setRotatingQr(false);
    if (result.success && typeof result.url === "string") setCheckinUrl(result.url);
    else setQrError(typeof result.error === "string" ? result.error : "Could not rotate link");
  }

  function handleDownloadPdf() {
    const canvas = qrCanvasRef.current;
    if (!canvas || !checkinUrl) return;

    const qrDataUrl = canvas.toDataURL("image/png");
    const shopName = tenantName;
    const branch = branchName ?? "Main Branch";
    const today = new Date().toLocaleDateString("en-MY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${shopName} – Customer Check-in QR</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .card {
      width: 520px;
      border: 2px solid #D4AF37;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 36px 40px 28px;
      text-align: center;
      position: relative;
    }
    .scissors-icon {
      color: #D4AF37;
      font-size: 28px;
      letter-spacing: 4px;
      margin-bottom: 12px;
      display: block;
    }
    .shop-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 30px;
      font-weight: 900;
      color: #D4AF37;
      letter-spacing: 1px;
      line-height: 1.1;
    }
    .branch-name {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 500;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #D4AF37, transparent);
      margin: 20px 40px 0;
    }
    .body {
      background: #fff;
      padding: 36px 40px;
      text-align: center;
    }
    .scan-label {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #888;
      margin-bottom: 24px;
    }
    .qr-wrapper {
      display: inline-flex;
      padding: 16px;
      background: #fff;
      border: 2px solid #e8e8e8;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }
    .qr-wrapper img { display: block; border-radius: 4px; }
    .instruction {
      font-size: 15px;
      color: #333;
      font-weight: 500;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    .instruction-sub {
      font-size: 12px;
      color: #999;
      line-height: 1.5;
    }
    .url-box {
      margin-top: 20px;
      background: #f7f5ef;
      border: 1px dashed #D4AF37;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 10px;
      color: #888;
      word-break: break-all;
      font-family: monospace;
    }
    .footer {
      background: #f9f9f9;
      border-top: 1px solid #eee;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .footer-logo span { color: #D4AF37; }
    .footer-date {
      font-size: 10px;
      color: #aaa;
      text-align: right;
    }
    @media print {
      body { padding: 0; display: block; }
      .card { width: 100%; border: none; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="scissors-icon">✂ ✂</span>
      <div class="shop-name">${shopName}</div>
      <div class="branch-name">${branch}</div>
      <div class="divider"></div>
    </div>
    <div class="body">
      <div class="scan-label">Scan to Join the Queue</div>
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" width="220" height="220" alt="Check-in QR Code" />
      </div>
      <p class="instruction">Scan with your phone camera<br/>to enter the walk-in queue</p>
      <p class="instruction-sub">Enter your name and number of haircuts — no app required.</p>
      <div class="url-box">${checkinUrl}</div>
    </div>
    <div class="footer">
      <div class="footer-logo"><span>✦</span> ${shopName}</div>
      <div class="footer-date">Printed ${today}</div>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function(){ window.print(); }, 400); };<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  async function handleClearStale() {
    if (!branchId) return;
    if (
      !confirm(
        "Cancel all waiting tickets from before today? This cannot be undone. Completed history is kept."
      )
    ) {
      return;
    }
    setStaleSubmitting(true);
    const result = await cancelStaleWaitingQueueTickets(branchId);
    setStaleSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    } else {
      alert(result.error ?? "Failed");
    }
  }

  async function handleCompleteWithPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const method = (fd.get("payment_method") as string) || "cash";
    const proof = fd.get("payment_proof");

    if (method === "qr" && (!(proof instanceof File) || proof.size === 0)) {
      setPaymentSubmitting(false);
      setPaymentError("Please upload payment proof for QR payment.");
      return;
    }

    const result = await completeQueueTicketWithPayment(fd);
    setPaymentSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowPaymentModal(null);
    } else {
      setPaymentError(result.error ?? "Failed to complete payment");
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
      hint: "In queue today",
      icon: Timer,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400"
    },
    {
      label: "In Service",
      value: String(stats.inProgress),
      hint: "Serving today",
      icon: UserCheck,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400"
    },
    {
      label: "Completed",
      value: String(stats.completed),
      hint: "Completed today",
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
    <div className="space-y-4">
      {/* Compact header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight">Walk-in Queue</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {clockReady ? (
                <>
                  <span className="text-xs text-gray-500">{formatShopDateLabel(clock)}</span>
                  <span className="font-mono text-xs text-[#D4AF37] tabular-nums">{formatShopTimeLabel(clock)}</span>
                </>
              ) : (
                <span className="text-xs text-gray-600">—</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void openQrModal()}
            className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Customer QR</span>
          </button>
          <Link
            href={queueBoardHref}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-white"
          >
            <MoveRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Queue Board</span>
          </Link>
          <button
            type="button"
            onClick={handleClearStale}
            disabled={staleSubmitting}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-amber-500/30 hover:text-amber-200 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear stale</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Scissors className="h-3.5 w-3.5" /> New Walk-in
          </button>
        </div>
      </div>

      {/* Stats bar — single compact row */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1a1a1a] px-4 py-3">
              <span className={`flex-shrink-0 rounded-lg p-1.5 ${s.iconBg}`}>
                <Icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {tabLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === i
                ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                : "border border-white/5 bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            {label}
            {tabCounts[i] > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === i ? "bg-[#D4AF37]/30 text-[#D4AF37]" : "bg-white/5 text-gray-500"
              }`}>
                {tabCounts[i]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {ticketsLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-white/5 bg-[#1a1a1a] py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#1a1a1a] py-14 gap-2">
              <Users className="h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">No tickets in this view</p>
            </div>
          ) : (
            filteredTickets.map((q) => {
              const isNext = q.status === "waiting" && q.id === nextWaitingId;
              const timer =
                q.status === "in_service" && q.called_at
                  ? formatServiceTime(q.called_at)
                  : formatWaitTime(q.created_at);
              const timerLabel = q.status === "in_service" ? "in service" : "wait";
              const preferredName = q.preferred_staff_id
                ? barbers.find((b) => b.staff_profile_id === q.preferred_staff_id)?.full_name ?? null
                : null;

              return (
                <Card key={q.id} className="relative">
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Queue number badge */}
                      <div
                        className={`shrink-0 flex items-center justify-center rounded-xl px-3 py-2.5 min-w-[56px] text-center ${
                          q.status === "in_service"
                            ? "border-2 border-blue-500 bg-[#2a2a2a]"
                            : isNext
                              ? "bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                              : q.status === "completed"
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : q.status === "cancelled"
                                  ? "bg-red-500/10 border border-red-500/20"
                                  : "border border-white/10 bg-[#2a2a2a]"
                        }`}
                      >
                        <span className={`text-lg font-black tracking-tight leading-none ${
                          q.status === "in_service"
                            ? "text-white"
                            : isNext
                              ? "text-[#111]"
                              : q.status === "completed"
                                ? "text-emerald-400"
                                : q.status === "cancelled"
                                  ? "text-red-400"
                                  : "text-gray-300"
                        }`}>
                          {q.queue_number}
                        </span>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* Name + status chips */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-base font-bold text-white leading-tight">
                                {q.customer?.full_name ?? "Walk-in Guest"}
                              </p>
                              {isNext && (
                                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#111]">
                                  Next
                                </span>
                              )}
                              {q.status === "in_service" && (
                                <span className="flex items-center gap-0.5 rounded-full bg-blue-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                  <Clock className="h-2.5 w-2.5" /> In Service
                                </span>
                              )}
                              {q.status === "completed" && (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                  Done
                                </span>
                              )}
                              {q.status === "cancelled" && (
                                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                              {q.customer?.phone && (
                                <span className="text-[11px] text-gray-500">{q.customer.phone}</span>
                              )}
                              {q.party_size > 1 && (
                                <span className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                                  ×{q.party_size} cuts
                                </span>
                              )}
                              {q.service && (
                                <span className="rounded border border-white/5 bg-[#111] px-1.5 py-0.5 text-[10px] text-gray-400">
                                  {q.service.name}
                                </span>
                              )}
                              {q.assigned_staff ? (
                                <span className="text-[11px] text-blue-400 font-medium">→ {q.assigned_staff.full_name}</span>
                              ) : preferredName ? (
                                <span className="text-[11px] text-[#D4AF37]/70">Prefers: {preferredName}</span>
                              ) : null}
                            </div>
                          </div>
                          {/* Timer */}
                          <div className="shrink-0 text-right">
                            <p className={`text-base font-bold font-mono tabular-nums ${
                              q.status === "in_service" ? "text-blue-400" : isNext ? "text-orange-400" : "text-gray-500"
                            }`}>
                              {timer}
                            </p>
                            <p className="text-[10px] text-gray-600">{timerLabel}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!["completed", "cancelled"].includes(q.status) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                        {q.status === "in_service" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { setPaymentError(null); setShowPaymentModal(q); }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                            >
                              <Banknote className="h-3.5 w-3.5" /> Receive payment
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:text-white"
                            >
                              Reassign
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> Cancel
                            </button>
                          </>
                        ) : q.status === "waiting" && q.assigned_staff_id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignSelectedBarber(q.assigned_staff_id ?? "");
                                setAssignSelectedSeat(q.seat_id ?? "");
                                setShowAssignModal(q);
                              }}
                              className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                            >
                              Start Service
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:text-white"
                            >
                              Reassign
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> Remove
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                            >
                              Assign Barber
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {q.status === "completed" && (
                      <div className="mt-3 flex gap-1.5 border-t border-white/5 pt-3">
                        <Link
                          href={buildPosPaymentHref(q)}
                          className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                        >
                          Proceed to Payment
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          {/* Seats card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Armchair className="h-3.5 w-3.5 text-[#D4AF37]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Seats</h3>
              </div>
              <button
                type="button"
                onClick={openNewSeatForm}
                className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition"
              >
                <Plus className="h-3 w-3" /> Add Seat
              </button>
            </div>
            {(seatsData?.data ?? []).length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-3">No seats configured. Add seats to track barber stations.</p>
            ) : (
              <div className="space-y-1.5">
                {(seatsData?.data ?? []).map((seat) => {
                  const isOccupied = tickets.some(
                    (t) => t.seat_id === seat.id && t.status === "in_service"
                  );
                  const servingTicket = tickets.find(
                    (t) => t.seat_id === seat.id && t.status === "in_service"
                  );
                  return (
                    <div
                      key={seat.id}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${
                        !seat.is_active
                          ? "border-white/5 bg-[#111] opacity-50"
                          : isOccupied
                            ? "border-blue-500/30 bg-blue-500/5"
                            : seat.staff_profile_id
                              ? "border-white/5 bg-[#111]"
                              : "border-dashed border-white/10 bg-[#0d0d0d]"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        isOccupied ? "bg-blue-500 text-white" : seat.is_active ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "bg-[#2a2a2a] text-gray-600"
                      }`}>
                        {seat.seat_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{seat.label || `Seat ${seat.seat_number}`}</p>
                        <p className="text-[10px] truncate">
                          {isOccupied && servingTicket ? (
                            <span className="text-blue-400">{servingTicket.customer?.full_name ?? "Walk-in"}</span>
                          ) : seat.barber_name ? (
                            <span className="text-gray-500">{seat.barber_name}</span>
                          ) : (
                            <span className="text-gray-700">No barber assigned</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOccupied ? (
                          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-400">Live</span>
                        ) : !seat.is_active ? (
                          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-600">Off</span>
                        ) : seat.staff_profile_id ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">Free</span>
                        ) : (
                          <span className="rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-500">Empty</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditSeatForm(seat)}
                          className="rounded p-1 text-gray-600 hover:text-gray-300 hover:bg-white/5 transition"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSeat(seat.id)}
                          className="rounded p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Barber Availability */}
          <Card className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Barber Availability</h3>
            <div className="space-y-2">
              {barberStatus.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold text-white">
                    {b.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.full_name}</p>
                    <p className="text-[11px] text-gray-500">
                      {b.servingCustomer ? `Serving ${b.servingCustomer}` : b.role}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusBadge[b.status]}`}>
                    {b.status === "available" ? "Free" : b.status === "busy" ? "Busy" : "Break"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {nowServing && (
            <Card className="border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/8 to-transparent p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Now Serving</h3>
                <Users className="h-3.5 w-3.5 text-[#D4AF37]/50" />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-black text-[#D4AF37] leading-none">{nowServing.queue_number}</p>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {nowServing.customer?.full_name ?? "Walk-in Guest"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {nowServing.assigned_staff?.full_name
                      ? nowServing.assigned_staff.full_name
                      : nowServing.seat
                        ? (nowServing.seat.label || `Seat ${nowServing.seat.seat_number}`)
                        : "No barber assigned"}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#1e1e1e] to-[#141414] px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <QrCode className="h-4 w-4 text-[#D4AF37]" />
                    <h3 className="text-base font-bold text-white">Customer Check-in QR</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    {tenantName}
                    {branchName ? <span className="text-gray-600"> · {branchName}</span> : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setShowRotateConfirm(false);
                    setCheckinUrl(null);
                    setQrError(null);
                  }}
                  className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {qrLoading && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
                  <p className="text-xs text-gray-500">Loading QR code…</p>
                </div>
              )}
              {!qrLoading && qrError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {qrError}
                </div>
              )}
              {!qrLoading && checkinUrl && !showRotateConfirm && (
                <div className="flex flex-col items-center gap-5">
                  {/* QR Display */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Scan to queue</span>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
                      <QRCodeCanvas
                        value={checkinUrl}
                        size={220}
                        level="H"
                        ref={qrCanvasRef}
                      />
                    </div>
                  </div>

                  {/* URL pill */}
                  <div className="mt-2 w-full rounded-lg bg-white/5 border border-white/5 px-3 py-2">
                    <p className="break-all text-center text-[10px] text-gray-500 font-mono leading-relaxed">
                      {checkinUrl}
                    </p>
                  </div>

                  {/* Info note */}
                  <p className="text-[11px] text-gray-600 text-center leading-relaxed px-2">
                    Customers scan to enter their name, number of haircuts, and optional phone number.
                    This QR code remains valid until you reset it.
                  </p>

                  {/* Action buttons */}
                  <div className="flex w-full flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#c9a430] active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" />
                      Download &amp; Print PDF
                    </button>
                    <button
                      type="button"
                      disabled={rotatingQr}
                      onClick={() => setShowRotateConfirm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${rotatingQr ? "animate-spin" : ""}`} />
                      Reset QR Code
                    </button>
                  </div>
                </div>
              )}

              {/* Rotate Confirmation Panel */}
              {!qrLoading && checkinUrl && showRotateConfirm && (
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
                    <AlertTriangle className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h4 className="text-base font-bold text-white">Generate New QR Code?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      The current QR code will be <span className="text-red-400 font-medium">permanently invalidated</span>. Anyone who scans the old code will see an error.
                    </p>
                  </div>
                  <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      After resetting, <strong className="text-amber-300">download and print the new QR code</strong> before placing it at your entrance. Any printed copies of the old code must be replaced.
                    </p>
                  </div>
                  <div className="flex w-full gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowRotateConfirm(false)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
                    >
                      Keep Current QR
                    </button>
                    <button
                      type="button"
                      disabled={rotatingQr}
                      onClick={() => void handleRotateQr()}
                      className="flex-1 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      {rotatingQr ? "Resetting…" : "Yes, Reset QR"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <label className="mb-1 block text-xs font-medium text-gray-400">Number of haircuts</label>
                <input
                  type="number"
                  name="party_size"
                  min={1}
                  max={20}
                  defaultValue={1}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Service</label>
                <select
                  name="service_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Select service</option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (RM {s.price})
                    </option>
                  ))}
                </select>
                {activeServices.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    No active services found.{" "}
                    <Link href="/services" className="font-medium text-[#D4AF37] underline hover:text-[#e8c85b]">
                      Create a service
                    </Link>{" "}
                    first.
                  </p>
                )}
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

      {/* Assign Barber + Seat Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {showAssignModal.status === "in_service" ? "Reassign" : "Assign Barber & Seat"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {showAssignModal.queue_number} · {showAssignModal.customer?.full_name ?? "Walk-in Guest"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAssignModal(null); setAssignSelectedBarber(""); setAssignSelectedSeat(""); }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Barber selection */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Select Barber</p>
            <div className="space-y-1.5 mb-4">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setAssignSelectedBarber(b.staff_profile_id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    assignSelectedBarber === b.staff_profile_id
                      ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                      : "border-white/10 bg-[#111] hover:border-[#D4AF37]/30"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    assignSelectedBarber === b.staff_profile_id ? "bg-[#D4AF37] text-[#111]" : "bg-[#D4AF37]/10 text-[#D4AF37]"
                  }`}>
                    {b.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{b.full_name}</p>
                    <p className="text-[10px] text-gray-500">{b.role}</p>
                  </div>
                  {busyStaffIds.has(b.staff_profile_id) && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] text-red-400">Busy</span>
                  )}
                </button>
              ))}
            </div>

            {/* Seat selection (only shown when starting service and seats exist) */}
            {(seatsData?.data ?? []).length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Assign Seat <span className="normal-case font-normal text-gray-600">(optional)</span></p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {(seatsData?.data ?? []).filter((s) => s.is_active).map((seat) => {
                    const occupied = tickets.some((t) => t.seat_id === seat.id && t.status === "in_service" && t.id !== showAssignModal.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={occupied}
                        onClick={() => setAssignSelectedSeat(assignSelectedSeat === seat.id ? "" : seat.id)}
                        className={`rounded-lg border p-2 text-center transition ${
                          occupied
                            ? "border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
                            : assignSelectedSeat === seat.id
                              ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
                              : "border-white/10 bg-[#111] hover:border-white/20"
                        }`}
                      >
                        <p className={`text-base font-black ${assignSelectedSeat === seat.id ? "text-[#D4AF37]" : "text-white"}`}>{seat.seat_number}</p>
                        <p className="text-[9px] text-gray-500 truncate">{seat.label || `Seat ${seat.seat_number}`}</p>
                        {occupied && <p className="text-[8px] text-red-400">Busy</p>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAssignModal(null); setAssignSelectedBarber(""); setAssignSelectedSeat(""); }}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!assignSelectedBarber}
                onClick={() => {
                  if (!assignSelectedBarber) return;
                  const status = showAssignModal.status === "in_service" ? "in_service" : "waiting";
                  void handleUpdateStatus(showAssignModal.id, status, assignSelectedBarber, assignSelectedSeat || null);
                }}
                className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-40"
              >
                {showAssignModal.status === "in_service" ? "Reassign" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Form Modal */}
      {showSeatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">{editingSeat ? "Edit Seat" : "Add Seat"}</h3>
              <button type="button" onClick={() => setShowSeatForm(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSeatFormSubmit(e)} className="space-y-4">
              {seatFormError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{seatFormError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Seat Number</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  required
                  value={seatFormNumber}
                  onChange={(e) => setSeatFormNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Label</label>
                <input
                  type="text"
                  maxLength={40}
                  required
                  value={seatFormLabel}
                  onChange={(e) => setSeatFormLabel(e.target.value)}
                  placeholder="e.g. Seat 1 or VIP Chair"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Assigned Barber <span className="text-gray-600">(optional)</span></label>
                <select
                  value={seatFormBarber}
                  onChange={(e) => setSeatFormBarber(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">— No barber —</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.staff_profile_id}>{b.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSeatForm(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition">Cancel</button>
                <button type="submit" disabled={seatFormSubmitting} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50 transition">
                  {seatFormSubmitting ? "Saving…" : editingSeat ? "Save Changes" : "Add Seat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Receive payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              {showPaymentModal.queue_number} - {showPaymentModal.customer?.full_name ?? "Walk-in Guest"}
            </p>

            <form onSubmit={handleCompleteWithPayment} className="space-y-4">
              {paymentError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{paymentError}</div>
              )}

              <input type="hidden" name="ticket_id" value={showPaymentModal.id} />

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount Due (RM)</label>
                <input
                  name="amount_due"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={(showPaymentModal.service?.price ?? 0).toFixed(2)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Amount Received (RM)</label>
                <input
                  name="amount_received"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={(showPaymentModal.service?.price ?? 0).toFixed(2)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Payment Method</label>
                <select
                  name="payment_method"
                  defaultValue="qr"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="qr">QR Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Payment Proof (for QR/online)
                </label>
                <input
                  name="payment_proof"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-[#D4AF37] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[#111]"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Upload a screenshot/photo from customer's banking app after successful payment.
                </p>
              </div>

              <button
                type="submit"
                disabled={paymentSubmitting}
                className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
              >
                {paymentSubmitting ? "Processing..." : "Confirm Payment & Complete Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
