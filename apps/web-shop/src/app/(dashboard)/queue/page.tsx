"use client";

import React from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronDown,
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
  useServices,
  useSupabase,
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { useT } from "@/lib/i18n/language-context";
import { useWalkInQueueModal } from "@/components/walk-in-queue-modal-context";
import {
  cancelStaleWaitingQueueTickets,
  completeQueueTicketWithPayment,
  createQueueTicket,
  getQueueCheckinUrl,
  rotateQueueCheckinToken,
  updateQueueStatus,
  addTicketSeatMember,
  completeTicketSeatMember,
  removeTicketSeatMember,
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

/** Frozen wait duration: from queue join until the moment they were called. */
function formatFrozenWait(createdAt: string, calledAt: string): string {
  const diffMs = new Date(calledAt).getTime() - new Date(createdAt).getTime();
  const mins = Math.floor(Math.max(0, diffMs) / 60000);
  const secs = Math.floor((Math.max(0, diffMs) % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Format a timestamp as a short local clock time, e.g. "3:45 PM". */
function formatJoinTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function buildPosPaymentHref(ticket: QueueTicketWithRelations): string {
  const params = new URLSearchParams();
  params.set("queue_ticket_id", ticket.id);
  if (ticket.customer_id) params.set("customer_id", ticket.customer_id);
  if (ticket.assigned_staff_id) params.set("staff_id", ticket.assigned_staff_id);

  // Collect all service IDs to pre-fill in POS:
  // For group tickets use seated members' services + extra check-in services.
  // For single-person tickets use check-in member_services (supports multiple), fallback to ticket.service_id.
  const serviceIds = new Set<string>();
  if (ticket.ticket_seats.length > 0) {
    for (const seat of ticket.ticket_seats) {
      if (seat.service_id) serviceIds.add(seat.service_id);
    }
    // Extra services from check-in that weren't stored in a seat row
    for (const ms of ticket.member_services) {
      if (!serviceIds.has(ms.service_id)) serviceIds.add(ms.service_id);
    }
  } else if (ticket.member_services.length > 0) {
    for (const ms of ticket.member_services) serviceIds.add(ms.service_id);
  } else if (ticket.service_id) {
    serviceIds.add(ticket.service_id);
  }
  for (const id of serviceIds) params.append("service_id", id);

  return `/pos?${params.toString()}`;
}

export default function QueuePage() {
  const t = useT();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { branchId, branchName, tenantName, tenantId } = useTenant();
  const { openRequestId } = useWalkInQueueModal();
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

  const activeTickets = tickets.filter((t) => !["completed", "paid", "cancelled"].includes(t.status));

  const nextWaitingId = [...tickets]
    .filter((t) => t.status === "waiting")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.id;
  // Collect barber IDs busy via group ticket seat members.
  const busyViaMembers = new Set(
    activeTickets.flatMap((t) =>
      t.ticket_seats
        .filter((m) => m.status === "in_service" && m.staff_id)
        .map((m) => m.staff_id as string)
    )
  );
  // Collect seat IDs occupied via group ticket seat members.
  const occupiedSeatsByMembers = new Set(
    activeTickets.flatMap((t) =>
      t.ticket_seats
        .filter((m) => m.status === "in_service" && m.seat_id)
        .map((m) => m.seat_id as string)
    )
  );

  const barberStatus = barbers.map((b) => {
    const staffProfileId = b.staff_profile_id;
    const isBusy =
      activeTickets.some((t) => t.assigned_staff_id === staffProfileId && t.status === "in_service" && t.party_size === 1) ||
      busyViaMembers.has(staffProfileId);
    const serving = activeTickets.find(
      (t) => t.assigned_staff_id === staffProfileId && t.status === "in_service" && t.party_size === 1
    ) ?? activeTickets.find((t) => t.ticket_seats.some((m) => m.staff_id === staffProfileId && m.status === "in_service"));
    return {
      ...b,
      status: isBusy ? "busy" : "available",
      servingCustomer: serving?.customer?.full_name ?? null
    };
  });
  const availableCount = barberStatus.filter((b) => b.status === "available").length;
  const busyStaffIds = new Set([
    ...activeTickets
      .filter((t) => t.status === "in_service" && t.assigned_staff_id && t.party_size === 1)
      .map((t) => t.assigned_staff_id as string),
    ...busyViaMembers,
  ]);

  const [activeTab, setActiveTab] = useState(0);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<QueueTicketWithRelations | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<QueueTicketWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkinUrl, setCheckinUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [rotatingQr, setRotatingQr] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastHeaderWalkInRequestRef = useRef(0);
  const [staleSubmitting, setStaleSubmitting] = useState(false);
  // Seat management state
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [editingSeat, setEditingSeat] = useState<BranchSeat | null>(null);
  const [seatFormNumber, setSeatFormNumber] = useState("");
  const [seatFormLabel, setSeatFormLabel] = useState("");
  const [seatFormBarber, setSeatFormBarber] = useState("");
  const [seatFormSubmitting, setSeatFormSubmitting] = useState(false);
  const [seatFormError, setSeatFormError] = useState<string | null>(null);
  // Assign modal: selected barber + seat (single tickets)
  const [assignSelectedBarber, setAssignSelectedBarber] = useState<string>("");
  const [assignSelectedSeat, setAssignSelectedSeat] = useState<string>("");
  // Party member assignment modal (group tickets)
  const [showMemberModal, setShowMemberModal] = useState<QueueTicketWithRelations | null>(null);
  const [memberStaffId, setMemberStaffId] = useState<string>("");
  const [memberSeatId, setMemberSeatId] = useState<string>("");
  const [memberServiceId, setMemberServiceId] = useState<string>("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  /** Avoid hydration mismatch: server vs client `new Date()` differ; show clock only after mount. */
  const [clockReady, setClockReady] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    setClock(new Date());
    setClockReady(true);
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (openRequestId > lastHeaderWalkInRequestRef.current) {
      lastHeaderWalkInRequestRef.current = openRequestId;
      setShowNewModal(true);
    }
  }, [openRequestId]);

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
              ? tickets.filter((t) => ["completed", "paid"].includes(t.status))
              : tickets.filter((t) => t.status === "cancelled");

  const DONE_STATUSES = ["completed", "paid", "cancelled"];
  // On the "All" tab: split active vs done for the collapsible section.
  const activeTicketList = activeTab === 0
    ? filteredTickets.filter((q) => !DONE_STATUSES.includes(q.status))
    : filteredTickets;
  const doneTicketList = activeTab === 0
    ? filteredTickets.filter((q) => DONE_STATUSES.includes(q.status))
    : [];
  const tabCounts = [
    tickets.length,
    tickets.filter((t) => t.status === "waiting").length,
    tickets.filter((t) => t.status === "waiting" && t.assigned_staff_id).length,
    tickets.filter((t) => t.status === "in_service").length,
    tickets.filter((t) => ["completed", "paid"].includes(t.status)).length,
    tickets.filter((t) => t.status === "cancelled").length
  ];
  const tabLabels = [t.queue.all, t.queue.waiting, t.queue.assigned, t.queue.inService, t.queue.completed, t.queue.cancelled];

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

  function closeMemberModal() {
    setShowMemberModal(null);
    setMemberStaffId("");
    setMemberSeatId("");
    setMemberServiceId("");
    setMemberError(null);
  }

  async function handleAddMember() {
    if (!showMemberModal) return;
    if (!memberSeatId) { setMemberError(t.queue.selectSeatRequired); return; }
    setMemberError(null);
    setMemberSubmitting(true);
    const nextSlot = showMemberModal.ticket_seats.length;
    const requestedForSlot = showMemberModal.member_services.filter((m) => m.member_index === nextSlot);
    const serviceId =
      memberServiceId ||
      requestedForSlot[0]?.service_id ||
      showMemberModal.service_id ||
      null;
    const result = await addTicketSeatMember(
      showMemberModal.id,
      memberStaffId || null,
      memberSeatId,
      serviceId
    );
    setMemberSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      closeMemberModal();
    } else {
      setMemberError(result.error ?? t.queue.seatMemberBtn);
    }
  }

  async function handleCompleteMember(memberId: string) {
    const result = await completeTicketSeatMember(memberId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    }
  }

  async function handleRemoveMember(memberId: string) {
    const result = await removeTicketSeatMember(memberId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
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
      setSeatFormError(result.error ?? t.queue.saving);
    }
  }

  function openNewSeatForm() {
    setEditingSeat(null);
    const seats = seatsData?.data ?? [];
    const nextNum = seats.length > 0 ? Math.max(...seats.map((s) => s.seat_number)) + 1 : 1;
    setSeatFormNumber(String(nextNum));
    setSeatFormLabel(`${t.queue.seat} ${nextNum}`);
    setSeatFormBarber("");
    setSeatFormError(null);
    setShowSeatForm(true);
  }

  function openEditSeatForm(seat: BranchSeat) {
    setEditingSeat(seat);
    setSeatFormNumber(String(seat.seat_number));
    setSeatFormLabel(seat.label || `${t.queue.seat} ${seat.seat_number}`);
    setSeatFormBarber(seat.staff_profile_id ?? "");
    setSeatFormError(null);
    setShowSeatForm(true);
  }

  async function handleDeleteSeat(seatId: string) {
    if (!confirm(t.queue.removeTicketConfirm)) return;
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
      <div class="scan-label">${t.queue.scanToQueue}</div>
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" width="220" height="220" alt="Check-in QR Code" />
      </div>
      <p class="instruction">${t.queue.scanToQueue}</p>
      <p class="instruction-sub">${t.queue.customersScan}</p>
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
    if (!confirm(t.queue.clearStaleConfirm)) {
      return;
    }
    setStaleSubmitting(true);
    const result = await cancelStaleWaitingQueueTickets(branchId);
    setStaleSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
    } else {
      alert(result.error ?? t.common.error);
    }
  }

  async function handleCompleteWithPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const method = (fd.get("payment_method") as string) || "cash";
    const proofFile = fd.get("payment_proof");

    if (method === "qr" && (!(proofFile instanceof File) || proofFile.size === 0)) {
      setPaymentSubmitting(false);
      setPaymentError(t.queue.uploadProofRequired);
      return;
    }

    // Upload the proof image client-side to avoid sending a large file through the server action.
    if (proofFile instanceof File && proofFile.size > 0) {
      const safeName = proofFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 96) || "receipt.jpg";
      const objectPath = `${tenantId}/queue-pay/${globalThis.crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(objectPath, proofFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: proofFile.type || "image/jpeg",
        });

      if (uploadError) {
        setPaymentSubmitting(false);
        setPaymentError(
          uploadError.message.includes("Bucket not found")
            ? "Receipt storage is not set up. Ask an admin to create the payment-proofs bucket."
            : `${t.queue.paymentProof}: ${uploadError.message}`
        );
        return;
      }

      fd.set("proof_storage_path", objectPath);
    }

    // Remove the raw File so it isn't serialized through the server action body.
    fd.delete("payment_proof");

    const result = await completeQueueTicketWithPayment(fd);
    setPaymentSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setProofPreview(null);
      setShowPaymentModal(null);
    } else {
      setPaymentError(result.error ?? t.common.error);
    }
  }

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-400">
        <p>{t.queue.selectBranch}</p>
      </div>
    );
  }

  const STATS = [
    {
      label: t.queue.waiting,
      value: String(stats.waiting),
      hint: t.queue.inQueueToday,
      icon: Timer,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400"
    },
    {
      label: t.queue.inService,
      value: String(stats.inProgress),
      hint: t.queue.servingToday,
      icon: UserCheck,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400"
    },
    {
      label: t.queue.completed,
      value: String(stats.completed),
      hint: t.queue.completedToday,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400"
    },
    {
      label: t.queue.available,
      value: String(availableCount),
      hint: t.queue.barbersReady,
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
            <h2 className="text-lg font-bold text-white leading-tight">{t.queue.walkInQueue}</h2>
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
            <span className="hidden sm:inline">{t.queue.customerQr}</span>
          </button>
          <Link
            href={queueBoardHref}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-white"
          >
            <MoveRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.queue.queueBoard}</span>
          </Link>
          <button
            type="button"
            onClick={handleClearStale}
            disabled={staleSubmitting}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-gray-400 transition hover:border-amber-500/30 hover:text-amber-200 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.queue.clearStale}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Scissors className="h-3.5 w-3.5" /> {t.queue.newWalkIn}
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
              <p className="text-sm text-gray-500">{t.queue.noTickets}</p>
            </div>
          ) : (
            // Sort: active tickets first, done (completed/paid/cancelled) last so the
            // toggle section always appears at the bottom when on the "All" tab.
            [...activeTicketList, ...doneTicketList].map((q, idx) => {
              const isDone = activeTab === 0 && DONE_STATUSES.includes(q.status);
              const prevQ = activeTicketList.length > 0 ? [...activeTicketList, ...doneTicketList][idx - 1] : null;
              const isFirstDone = isDone && (idx === 0 || !DONE_STATUSES.includes(prevQ?.status ?? ""));
              const isNext = q.status === "waiting" && q.id === nextWaitingId;
              const freezeAt = q.called_at ?? q.completed_at;
              const isWaitFrozen = q.status !== "waiting" && !!freezeAt;
              const timer = isWaitFrozen
                ? formatFrozenWait(q.created_at, freezeAt!)
                : formatWaitTime(q.created_at);
              const timerLabel = t.queue.wait;
              const joinTime = formatJoinTime(q.created_at);
              const isPaid = q.status === "paid";
              const preferredName = q.preferred_staff_id
                ? barbers.find((b) => b.staff_profile_id === q.preferred_staff_id)?.full_name ?? null
                : null;

              const card = (
                <Card className="relative">
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Queue number badge */}
                      <div
                        className={`shrink-0 flex items-center justify-center rounded-xl px-3 py-2.5 min-w-[56px] text-center ${
                          q.status === "in_service"
                            ? "border-2 border-blue-500 bg-[#2a2a2a]"
                            : isNext
                              ? "bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                              : isPaid
                                ? "bg-emerald-500/15 border border-emerald-500/30"
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
                              : isPaid || q.status === "completed"
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
                                {q.customer?.full_name ?? t.queue.walkInGuest}
                              </p>
                              {isNext && (
                                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#111]">
                                  {t.queue.next}
                                </span>
                              )}
                              {q.status === "in_service" && (
                                <span className="flex items-center gap-0.5 rounded-full bg-blue-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                  <Clock className="h-2.5 w-2.5" /> {t.queue.inService}
                                </span>
                              )}
                              {isPaid && (
                                <span className="rounded-full bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                                  ✓ Paid
                                </span>
                              )}
                              {q.status === "completed" && !isPaid && (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                  {t.queue.completed}
                                </span>
                              )}
                              {q.status === "cancelled" && (
                                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                                  {t.queue.cancelled}
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
                                  ×{q.party_size} {t.queue.cuts}
                                </span>
                              )}
                              {q.service ? (
                                <span className="rounded border border-white/5 bg-[#111] px-1.5 py-0.5 text-[10px] text-gray-400">
                                  {q.service.name}
                                </span>
                              ) : q.party_size === 1 && q.member_services.length > 0 ? (
                                q.member_services.map((ms) => (
                                  <span key={ms.service_id} className="rounded border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-1.5 py-0.5 text-[10px] text-[#D4AF37]/80">
                                    {ms.service_name}
                                  </span>
                                ))
                              ) : null}
                              {q.assigned_staff ? (
                                <span className="text-[11px] text-blue-400 font-medium">→ {q.assigned_staff.full_name}</span>
                              ) : preferredName ? (
                                <span className="text-[11px] text-[#D4AF37]/70">{t.queue.prefers} {preferredName}</span>
                              ) : null}
                            </div>
                          </div>
                          {/* Timer */}
                          <div className="shrink-0 text-right">
                            <p className={`text-base font-bold font-mono tabular-nums ${
                              isWaitFrozen ? "text-gray-400" : isNext ? "text-orange-400" : "text-gray-500"
                            }`}>
                              {timer}
                            </p>
                            <p className="text-[10px] text-gray-600">
                              {isWaitFrozen ? "waited" : timerLabel}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                              {joinTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Party member rows for group tickets */}
                    {q.party_size > 1 && (
                      <div className="mt-3 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {t.queue.partyMembers} · {q.ticket_seats.length}/{q.party_size} {t.queue.seated}
                          </p>
                          {!["completed", "paid", "cancelled"].includes(q.status) && q.ticket_seats.length < q.party_size && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextIndex = q.ticket_seats.length;
                                const preFill = q.member_services.filter((m) => m.member_index === nextIndex)[0];
                                setShowMemberModal(q);
                                setMemberServiceId(preFill?.service_id ?? q.service_id ?? "");
                              }}
                              className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition"
                            >
                              <Plus className="h-3 w-3" /> {t.queue.seatMember}
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {q.ticket_seats.map((m, idx) => (
                            <div key={m.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                              m.status === "completed"
                                ? "bg-emerald-500/5 border border-emerald-500/15"
                                : "bg-blue-500/5 border border-blue-500/15"
                            }`}>
                              <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${
                                m.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                              }`}>{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-white">{m.staff?.full_name ?? "—"}</span>
                                {m.seat && <span className="text-gray-500 ml-1.5">· {m.seat.label || `Seat ${m.seat.seat_number}`}</span>}
                                {m.service && <span className="ml-1.5 rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] text-gray-400">{m.service.name}</span>}
                              </div>
                              {m.status === "completed" ? (
                                <span className="shrink-0 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wide">{t.queue.completed}</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleCompleteMember(m.id)}
                                  className="shrink-0 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-[#111] hover:brightness-110 transition"
                                  title={t.queue.completed}
                                >
                                  ✓ {t.common.done}
                                </button>
                              )}
                              {!["completed", "paid", "cancelled"].includes(q.status) && m.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveMember(m.id)}
                                  className="shrink-0 rounded p-0.5 text-gray-700 hover:text-red-400 transition"
                                  title="Remove this member"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {/* Empty slots for unassigned members */}
                          {!["completed", "paid", "cancelled"].includes(q.status) &&
                            Array.from({ length: q.party_size - q.ticket_seats.length }).map((_, i) => {
                              const slotIndex = q.ticket_seats.length + i;
                              const requestedServices = q.member_services.filter((m) => m.member_index === slotIndex);
                              return (
                                <button
                                  key={`empty-${i}`}
                                  type="button"
                                  onClick={() => {
                                    const preFill = requestedServices[0];
                                    setShowMemberModal(q);
                                    setMemberServiceId(preFill?.service_id ?? q.service_id ?? "");
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-2.5 py-1.5 text-xs text-gray-600 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]/60 transition"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 text-[9px]">
                                    {slotIndex + 1}
                                  </span>
                                  <span className="flex-1 text-left">{t.queue.waitingForSeat}</span>
                                  {requestedServices.length > 0 && (
                                    <span className="rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#D4AF37]">
                                      {requestedServices.map((s) => s.service_name).join(", ")}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!["completed", "paid", "cancelled"].includes(q.status) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                        {q.status === "in_service" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { setPaymentError(null); setShowPaymentModal(q); }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                            >
                              <Banknote className="h-3.5 w-3.5" /> {t.queue.receivePayment}
                            </button>
                            {q.party_size === 1 && (
                              <button
                                type="button"
                                onClick={() => setShowAssignModal(q)}
                                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:text-white"
                              >
                                {t.queue.reassign}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> {t.queue.cancel}
                            </button>
                          </>
                        ) : q.status === "waiting" && q.assigned_staff_id && q.party_size === 1 ? (
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
                              {t.queue.startService}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:text-white"
                            >
                              {t.queue.reassign}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> {t.queue.remove}
                            </button>
                          </>
                        ) : q.party_size > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(q.id, "cancelled")}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                          >
                            <XCircle className="mr-1 inline h-3 w-3" /> {t.queue.cancelGroup}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowAssignModal(q)}
                              className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                            >
                              {t.queue.assignBarber}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(q.id, "cancelled")}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-red-400 transition hover:text-red-300"
                            >
                              <XCircle className="mr-1 inline h-3 w-3" /> {t.queue.remove}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {q.status === "completed" && !isPaid && (
                      <div className="mt-3 flex gap-1.5 border-t border-white/5 pt-3">
                        <Link
                          href={buildPosPaymentHref(q)}
                          className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] transition hover:brightness-110"
                        >
                          {t.queue.proceedToPayment}
                        </Link>
                      </div>
                    )}
                    {isPaid && (
                      <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-3">
                        <span className="text-[11px] text-emerald-400/70">✓ Payment received</span>
                      </div>
                    )}
                  </div>
                </Card>
              );

              return (
                <React.Fragment key={q.id}>
                  {isFirstDone && (
                    <button
                      type="button"
                      onClick={() => setShowCompletedSection((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#1a1a1a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:border-white/10 hover:text-gray-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                        <span>Completed · {doneTicketList.length}</span>
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showCompletedSection ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  {(!isDone || showCompletedSection) && card}
                </React.Fragment>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.queue.seats}</h3>
              </div>
              <button
                type="button"
                onClick={openNewSeatForm}
                className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition"
              >
                <Plus className="h-3 w-3" /> {t.queue.addSeat}
              </button>
            </div>
            {(seatsData?.data ?? []).length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-3">{t.queue.noSeatsConfigured}</p>
            ) : (
              <div className="space-y-1.5">
                {(seatsData?.data ?? []).map((seat) => {
                  const isOccupied =
                    tickets.some((t) => t.seat_id === seat.id && t.status === "in_service") ||
                    occupiedSeatsByMembers.has(seat.id);
                  const servingTicket =
                    tickets.find((t) => t.seat_id === seat.id && t.status === "in_service") ??
                    tickets.find((t) => t.ticket_seats.some((m) => m.seat_id === seat.id && m.status === "in_service"));
                  const servingMember = servingTicket?.ticket_seats.find((m) => m.seat_id === seat.id && m.status === "in_service");
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
                        <p className="text-xs font-semibold text-white truncate">{seat.label || `${t.queue.seat} ${seat.seat_number}`}</p>
                        <p className="text-[10px] truncate">
                          {isOccupied && servingTicket ? (
                            <span className="text-blue-400">
                              {servingMember
                                ? `${servingTicket.queue_number} · ${servingMember.staff?.full_name ?? servingTicket.customer?.full_name ?? t.queue.walkInGuest}`
                                : servingTicket.customer?.full_name ?? t.queue.walkInGuest}
                            </span>
                          ) : seat.barber_name ? (
                            <span className="text-gray-500">{seat.barber_name}</span>
                          ) : (
                            <span className="text-gray-700">{t.queue.noBarberAssigned}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOccupied ? (
                          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-400">{t.queue.live}</span>
                        ) : !seat.is_active ? (
                          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-600">{t.queue.off}</span>
                        ) : seat.staff_profile_id ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">{t.queue.free}</span>
                        ) : (
                          <span className="rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-500">{t.queue.empty}</span>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{t.queue.barberAvailability}</h3>
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
                      {b.servingCustomer ? `${t.queue.serving} ${b.servingCustomer}` : b.role}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusBadge[b.status]}`}>
                    {b.status === "available" ? t.queue.free : b.status === "busy" ? t.queue.busy : "Break"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {nowServing && (
            <Card className="border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/8 to-transparent p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{t.queue.nowServing}</h3>
                <Users className="h-3.5 w-3.5 text-[#D4AF37]/50" />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-black text-[#D4AF37] leading-none">{nowServing.queue_number}</p>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {nowServing.customer?.full_name ?? t.queue.walkInGuest}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {nowServing.assigned_staff?.full_name
                      ? nowServing.assigned_staff.full_name
                      : nowServing.seat
                        ? (nowServing.seat.label || `${t.queue.seat} ${nowServing.seat.seat_number}`)
                        : t.queue.noBarberAssigned}
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
                    <h3 className="text-base font-bold text-white">{t.queue.customerCheckinQr}</h3>
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
                  <p className="text-xs text-gray-500">{t.queue.loadingQr}</p>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{t.queue.scanToQueue}</span>
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
                    {t.queue.customersScan}
                  </p>

                  {/* Action buttons */}
                  <div className="flex w-full flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#c9a430] active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" />
                      {t.queue.downloadPrint}
                    </button>
                    <button
                      type="button"
                      disabled={rotatingQr}
                      onClick={() => setShowRotateConfirm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${rotatingQr ? "animate-spin" : ""}`} />
                      {t.queue.resetQr}
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
                    <h4 className="text-base font-bold text-white">{t.queue.generateNewQr}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {t.queue.qrInvalidated} <span className="text-red-400 font-medium">{t.queue.permanentlyInvalidated}</span>. {t.queue.oldCodeError}
                    </p>
                  </div>
                  <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      {t.queue.afterResetting}
                    </p>
                  </div>
                  <div className="flex w-full gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowRotateConfirm(false)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
                    >
                      {t.queue.keepCurrentQr}
                    </button>
                    <button
                      type="button"
                      disabled={rotatingQr}
                      onClick={() => void handleRotateQr()}
                      className="flex-1 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      {rotatingQr ? t.queue.resetting : t.queue.yesResetQr}
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
              <h3 className="text-lg font-bold text-white">{t.queue.newWalkInTitle}</h3>
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
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.customerOptional}</label>
                <input
                  name="customer_search"
                  placeholder={t.queue.searchCustomer}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  readOnly
                />
                <input type="hidden" name="customer_id" id="customer_id" />
                <p className="mt-1 text-[10px] text-gray-500">{t.queue.walkInIfEmpty}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.numberOfHaircuts}</label>
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
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.service}</label>
                <select
                  name="service_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">{t.queue.selectService}</option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (RM {s.price})
                    </option>
                  ))}
                </select>
                {activeServices.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    {t.queue.noActiveServices}{" "}
                    <Link href="/services" className="font-medium text-[#D4AF37] underline hover:text-[#e8c85b]">
                      {t.queue.createService}
                    </Link>{" "}
                    first.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.preferredBarber}</label>
                <select
                  name="preferred_staff_id"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">{t.queue.anyAvailable}</option>
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
                  {t.queue.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? t.queue.adding : t.queue.addToQueue}
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
                  {showAssignModal.status === "in_service" ? t.queue.reassign : t.queue.assignBarberSeat}
                </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                  {showAssignModal.queue_number} · {showAssignModal.customer?.full_name ?? t.queue.walkInGuest}
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

            {/* Seat-first selection (mirrors party member modal); falls back to barber list if no seats configured */}
            {(seatsData?.data ?? []).filter((s) => s.is_active).length > 0 ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t.queue.seat}</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {(seatsData?.data ?? []).filter((s) => s.is_active).map((seat) => {
                    const occupied =
                      (tickets.some((t) => t.seat_id === seat.id && t.status === "in_service" && t.id !== showAssignModal.id)) ||
                      occupiedSeatsByMembers.has(seat.id);
                    const isSelected = assignSelectedSeat === seat.id;
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={occupied}
                        onClick={() => {
                          if (isSelected) {
                            setAssignSelectedSeat("");
                            setAssignSelectedBarber("");
                          } else {
                            setAssignSelectedSeat(seat.id);
                            setAssignSelectedBarber(seat.staff_profile_id ?? "");
                          }
                        }}
                        className={`rounded-lg border p-2.5 text-left transition ${
                          occupied
                            ? "border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
                              : "border-white/10 bg-[#111] hover:border-[#D4AF37]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${isSelected ? "bg-[#D4AF37] text-[#111]" : "bg-white/5 text-gray-300"}`}>
                            {seat.seat_number}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-[#D4AF37]" : "text-white"}`}>
                              {seat.label || `Seat ${seat.seat_number}`}
                            </p>
                            <p className="text-[10px] truncate">
                              {occupied
                                ? <span className="text-red-400">{t.queue.busy}</span>
                                : seat.barber_name
                                  ? <span className="text-gray-400">{seat.barber_name}</span>
                                  : <span className="text-gray-600">{t.queue.noBarberShort}</span>
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t.queue.selectBarber}</p>
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
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] text-red-400">{t.queue.busy}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAssignModal(null); setAssignSelectedBarber(""); setAssignSelectedSeat(""); }}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition"
              >
                {t.queue.cancel}
              </button>
              <button
                type="button"
                disabled={
                  (seatsData?.data ?? []).filter((s) => s.is_active).length > 0
                    ? !assignSelectedSeat
                    : !assignSelectedBarber
                }
                onClick={() => {
                  const status = showAssignModal.status === "in_service" ? "in_service" : "waiting";
                  void handleUpdateStatus(showAssignModal.id, status, assignSelectedBarber || undefined, assignSelectedSeat || null);
                }}
                className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-40"
              >
                {showAssignModal.status === "in_service" ? t.queue.reassign : t.queue.assign}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Party Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            {(() => {
              const nextSlot = showMemberModal.ticket_seats.length;
              const requestedServices = showMemberModal.member_services.filter((m) => m.member_index === nextSlot);
              return (
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{t.queue.seatPartyMember}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {showMemberModal.queue_number} · {showMemberModal.customer?.full_name ?? t.queue.walkInGuest} · {t.queue.member} {nextSlot + 1} {t.queue.of} {showMemberModal.party_size}
                    </p>
                    {requestedServices.length > 0 && (
                      <p className="mt-1 text-[11px] text-[#D4AF37]/80">
                        {t.queue.requested} <span className="font-semibold text-[#D4AF37]">{requestedServices.map((s) => s.service_name).join(", ")}</span>
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={closeMemberModal} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })()}

            {memberError && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{memberError}</div>
            )}

            {/* Seat selection — required */}
            {(seatsData?.data ?? []).length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{t.queue.seat}</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {(seatsData?.data ?? []).filter((s) => s.is_active).map((seat) => {
                    const occupied =
                      tickets.some((t) => t.seat_id === seat.id && t.status === "in_service") ||
                      occupiedSeatsByMembers.has(seat.id);
                    const isSelected = memberSeatId === seat.id;
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={occupied}
                        onClick={() => {
                          if (isSelected) {
                            setMemberSeatId("");
                          } else {
                            setMemberSeatId(seat.id);
                            // Auto-assign the barber pre-assigned to this seat (if any)
                            if (seat.staff_profile_id) {
                              setMemberStaffId(seat.staff_profile_id);
                            }
                          }
                        }}
                        className={`rounded-lg border p-2.5 text-left transition ${
                          occupied
                            ? "border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
                              : "border-white/10 bg-[#111] hover:border-[#D4AF37]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${isSelected ? "bg-[#D4AF37] text-[#111]" : "bg-white/5 text-gray-300"}`}>
                            {seat.seat_number}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-[#D4AF37]" : "text-white"}`}>
                              {seat.label || `Seat ${seat.seat_number}`}
                            </p>
                            <p className="text-[10px] truncate">
                              {occupied
                                ? <span className="text-red-400">{t.queue.busy}</span>
                                : seat.barber_name
                                  ? <span className="text-gray-400">{seat.barber_name}</span>
                                  : <span className="text-gray-600">{t.queue.noBarberShort}</span>
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={closeMemberModal} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition">
                {t.queue.cancel}
              </button>
              <button
                type="button"
                disabled={memberSubmitting || !memberSeatId}
                onClick={() => void handleAddMember()}
                className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50 transition"
              >
                {memberSubmitting ? t.queue.seating : t.queue.seatMemberBtn}
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
              <h3 className="text-base font-bold text-white">{editingSeat ? t.queue.editSeat : t.queue.addSeatTitle}</h3>
              <button type="button" onClick={() => setShowSeatForm(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSeatFormSubmit(e)} className="space-y-4">
              {seatFormError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{seatFormError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.seatNumber}</label>
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
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.label}</label>
                <input
                  type="text"
                  maxLength={40}
                  required
                  value={seatFormLabel}
                  onChange={(e) => setSeatFormLabel(e.target.value)}
                  placeholder="cth. Kerusi 1 atau Kerusi VIP"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.assignedBarber} <span className="text-gray-600">({t.queue.optional})</span></label>
                <select
                  value={seatFormBarber}
                  onChange={(e) => setSeatFormBarber(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="">{t.queue.noBarber}</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.staff_profile_id}>{b.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSeatForm(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition">{t.queue.cancel}</button>
                <button type="submit" disabled={seatFormSubmitting} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] hover:brightness-110 disabled:opacity-50 transition">
                  {seatFormSubmitting ? t.queue.saving : editingSeat ? t.queue.saveChanges : t.queue.addSeatTitle}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (() => {
        const members = showPaymentModal.ticket_seats.filter((m) => m.status !== "cancelled");
        const isGroup = members.length > 0;
        // Extra check-in services per seated member beyond the one stored in the seat row
        const groupExtraServices = members.map((m, idx) =>
          showPaymentModal.member_services.filter(
            (ms) => ms.member_index === idx && ms.service_id !== m.service_id
          )
        );
        const groupExtraTotal = groupExtraServices.flat().reduce((sum, ms) => sum + ms.service_price, 0);
        const groupTotal = members.reduce((sum, m) => sum + (m.service?.price ?? 0), 0) + groupExtraTotal;
        // Flat list of line items for group payment (includes extra services per member)
        const groupLineItems = isGroup
          ? members.flatMap((m, idx) => [
              {
                key: m.id,
                name: m.service?.name ?? t.queue.walkInService,
                detail: `${m.staff?.full_name ?? "—"}${m.seat ? ` · ${m.seat.label || `Seat ${m.seat.seat_number}`}` : ""}`,
                price: m.service?.price ?? 0,
                isExtra: false,
                slotNum: idx + 1,
              },
              ...(groupExtraServices[idx] ?? []).map((ms) => ({
                key: `${m.id}-${ms.service_id}`,
                name: ms.service_name,
                detail: m.staff?.full_name ?? "—",
                price: ms.service_price,
                isExtra: true,
                slotNum: idx + 1,
              })),
            ])
          : [];
        // For single tickets: try service from ticket_service, then member_services[0]
        const singleService = showPaymentModal.service
          ?? (showPaymentModal.member_services[0]
            ? { name: showPaymentModal.member_services[0].service_name, price: showPaymentModal.member_services[0].service_price }
            : null);
        // All member_services for a single-person ticket (may have multiple)
        const singleAllServices = !isGroup && showPaymentModal.party_size === 1
          ? showPaymentModal.member_services
          : [];
        const singleServicesTotal = singleAllServices.reduce((sum, m) => sum + m.service_price, 0);
        // For member-services-only breakdown (group size > 1, no seat members assigned yet)
        const hasMemberServicesOnly = !isGroup && showPaymentModal.member_services.length > 0 && showPaymentModal.party_size > 1;
        const memberServicesTotal = showPaymentModal.member_services.reduce((sum, m) => sum + m.service_price, 0);

        const defaultAmount = isGroup
          ? groupTotal.toFixed(2)
          : hasMemberServicesOnly
            ? memberServicesTotal.toFixed(2)
            : singleAllServices.length > 0
              ? singleServicesTotal.toFixed(2)
              : (singleService?.price ?? 0).toFixed(2);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t.queue.receivePaymentTitle}</h3>
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(null); setProofPreview(null); }}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-gray-400">
                {showPaymentModal.queue_number} · {showPaymentModal.customer?.full_name ?? t.queue.walkInGuest}
                {(isGroup || hasMemberServicesOnly) && (
                  <span className="ml-1.5 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                    {t.queue.partyOf} {showPaymentModal.party_size}
                  </span>
                )}
              </p>

              {/* Single ticket services breakdown */}
              {!isGroup && !hasMemberServicesOnly && (singleAllServices.length > 0 || singleService) && (
                <div className="mb-4 rounded-xl border border-white/5 bg-[#111] divide-y divide-white/5">
                  {singleAllServices.length > 0 ? (
                    <>
                      {singleAllServices.map((ms, idx) => (
                        <div key={ms.service_id} className="flex items-center gap-3 px-3 py-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[9px] font-black text-[#D4AF37]">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">{ms.service_name}</p>
                            {showPaymentModal.assigned_staff && idx === 0 && (
                              <p className="text-[10px] text-gray-500">{showPaymentModal.assigned_staff.full_name}</p>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#D4AF37]">RM {ms.service_price.toFixed(2)}</p>
                        </div>
                      ))}
                      {singleAllServices.length > 1 && (
                        <div className="flex items-center justify-between px-3 py-2.5 bg-white/3">
                          <p className="text-xs font-bold text-white">{t.queue.total}</p>
                          <p className="text-sm font-black text-[#D4AF37]">RM {singleServicesTotal.toFixed(2)}</p>
                        </div>
                      )}
                    </>
                  ) : singleService ? (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[9px] font-black text-[#D4AF37]">1</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{singleService.name}</p>
                        {showPaymentModal.assigned_staff && (
                          <p className="text-[10px] text-gray-500">{showPaymentModal.assigned_staff.full_name}</p>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#D4AF37]">RM {singleService.price.toFixed(2)}</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Group ticket with seated members: per-member breakdown */}
              {isGroup && (
                <div className="mb-4 rounded-xl border border-white/5 bg-[#111] divide-y divide-white/5">
                  {groupLineItems.map((line) => (
                    <div key={line.key} className="flex items-center gap-3 px-3 py-2.5">
                      {line.isExtra ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[10px] font-black text-[#D4AF37]/60">+</span>
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[9px] font-black text-blue-400">{line.slotNum}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${line.isExtra ? "text-gray-300" : "text-white"}`}>{line.name}</p>
                        <p className="text-[10px] text-gray-500">{line.detail}</p>
                      </div>
                      <p className="text-xs font-bold text-[#D4AF37]">RM {line.price.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/3">
                    <p className="text-xs font-bold text-white">{t.queue.total}</p>
                    <p className="text-sm font-black text-[#D4AF37]">RM {groupTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Group ticket with member_services but no seat members yet */}
              {hasMemberServicesOnly && (
                <div className="mb-4 rounded-xl border border-white/5 bg-[#111] divide-y divide-white/5">
                  {showPaymentModal.member_services.map((m) => (
                    <div key={m.member_index} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[9px] font-black text-[#D4AF37]">{m.member_index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{m.service_name}</p>
                        <p className="text-[10px] text-gray-500">{t.queue.customerSelection}</p>
                      </div>
                      <p className="text-xs font-bold text-[#D4AF37]">RM {m.service_price.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/3">
                    <p className="text-xs font-bold text-white">{t.queue.total}</p>
                    <p className="text-sm font-black text-[#D4AF37]">RM {memberServicesTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCompleteWithPayment} className="space-y-4">
                {paymentError && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{paymentError}</div>
                )}

                <input type="hidden" name="ticket_id" value={showPaymentModal.id} />

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    {isGroup ? t.queue.totalAmountDue : t.queue.amountDue}
                  </label>
                  <input
                    name="amount_due"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={defaultAmount}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.amountReceived}</label>
                  <input
                    name="amount_received"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={defaultAmount}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">{t.queue.paymentMethod}</label>
                  <select
                    name="payment_method"
                    defaultValue="qr"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="cash">{t.queue.cash}</option>
                    <option value="card">{t.queue.card}</option>
                    <option value="ewallet">{t.queue.ewallet}</option>
                    <option value="qr">{t.queue.qrTransfer}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    {t.queue.paymentProof}
                  </label>
                  <input
                    ref={proofInputRef}
                    name="payment_proof"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setProofPreview(url);
                      } else {
                        setProofPreview(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-white/15 bg-[#111] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                    style={{ minHeight: proofPreview ? undefined : "110px" }}
                  >
                    {proofPreview ? (
                      <div className="relative">
                        <img
                          src={proofPreview}
                          alt="Payment proof preview"
                          className="max-h-52 w-full rounded-xl object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition hover:opacity-100">
                          <span className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111]">
                            {t.queue.changePhoto}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-7">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                          <circle cx="12" cy="13" r="3"/>
                        </svg>
                        <span className="text-xs font-medium text-gray-400">{t.queue.tapToPhoto}</span>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
                >
                  {paymentSubmitting ? t.queue.processing : t.queue.confirmPayment}
                </button>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
