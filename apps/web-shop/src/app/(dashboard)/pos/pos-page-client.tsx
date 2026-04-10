"use client";

import {
  Banknote,
  Camera,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  Scissors,
  Package,
  Search,
  ShoppingCart,
  Smartphone,
  Ticket,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import {
  useServices,
  useServiceCategories,
  useInventoryItems,
  useStaffMembers,
  useCustomers,
  useQueueTickets,
  useSupabase,
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { createTransaction, createTransactionFromQueueTicket } from "@/actions/pos";
import { useT } from "@/lib/i18n/language-context";
import { SST_RATE } from "@/lib/malaysian-tax";
import {
  buildLinkedServiceLines,
  type PosLinkedServiceLine,
  type QueueTicketWithRelations,
} from "@/services/queue";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  type: "service" | "product";
  serviceId?: string;
  inventoryItemId?: string;
};

type Tab = "services" | "products";

type ReceiptData = {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  barberName: string;
  paidAt: string;
};

// ─── Selector Dropdown ────────────────────────────────────────────────────────

type SelectorOption = { label: string; sub?: string; value: string };

function SelectorDropdown({
  icon: Icon,
  label,
  options,
  value,
  onChange,
  searchable,
  searchValue,
  onSearchChange,
}: {
  icon: React.ElementType;
  label: string;
  options: SelectorOption[];
  value: string;
  onChange: (v: string) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition ${
          open ? "border-[#D4AF37]/50 bg-[#1a1a1a]" : "border-white/10 bg-[#1a1a1a] hover:border-white/20"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span className="flex-1 truncate font-medium text-white">
          {selected ? selected.label : label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#222] shadow-2xl shadow-black/60">
          {searchable && (
            <div className="border-b border-white/5 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg bg-[#111] py-2 pl-8 pr-3 text-sm text-white placeholder-gray-600 outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  onSearchChange?.("");
                }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                  value === opt.value ? "text-[#D4AF37]" : "text-white"
                }`}
              >
                <span>{opt.label}</span>
                {opt.sub && <span className="ml-2 shrink-0 text-xs text-gray-500">{opt.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order panel content (shared between bottom sheet & desktop sidebar) ──────

type OrderContentProps = {
  cart: CartItem[];
  linkedServiceLines: PosLinkedServiceLine[];
  hasUnassignedBarber: boolean;
  subtotal: number;
  tax: number;
  total: number;
  serviceTaxLabelPct: number;
  checkoutError: string | null;
  submitting: boolean;
  onUpdateQty: (id: string, type: "service" | "product", delta: number) => void;
  onCheckout: (method: string) => void;
  onQrPay: () => void;
};

function OrderContent({
  cart,
  linkedServiceLines,
  hasUnassignedBarber,
  subtotal,
  tax,
  total,
  serviceTaxLabelPct,
  checkoutError,
  submitting,
  onUpdateQty,
  onCheckout,
  onQrPay,
}: OrderContentProps) {
  const hasItems = cart.length > 0 || linkedServiceLines.length > 0;
  const paymentBlocked = !hasItems || hasUnassignedBarber;

  return (
    <>
      {/* Line items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {hasUnassignedBarber && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
            All seated members must have a barber assigned. Complete assignments in Queue first.
          </div>
        )}
        {linkedServiceLines.length > 0 && (
          <>
            <p className="px-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Services from queue
            </p>
            {linkedServiceLines.map((line) => (
              <div
                key={line.seatMemberId}
                className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{line.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    <Scissors className="mr-1 inline h-3 w-3 text-[#D4AF37]/60" />
                    {line.staffName}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#D4AF37]">
                  RM {line.unitPrice.toFixed(2)}
                </span>
              </div>
            ))}
            {cart.length > 0 && (
              <p className="mt-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Products
              </p>
            )}
          </>
        )}
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <ShoppingCart className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No items yet</p>
            <p className="text-xs text-gray-600">Tap a service or product to add it</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={`${item.id}-${item.type}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-gray-500">RM {item.price.toFixed(2)} each</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, item.type, -1)}
                  aria-label="Decrease"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333] active:scale-95"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-bold text-white">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, item.type, 1)}
                  aria-label="Increase"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333] active:scale-95"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, item.type, -item.qty)}
                  aria-label="Remove"
                  className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full text-red-400 transition hover:bg-red-500/10 hover:text-red-300 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals + payment */}
      <div className="shrink-0 border-t border-white/5 p-4 space-y-4">
        {checkoutError && (
          <div className="rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            {checkoutError}
          </div>
        )}

        <div className="space-y-1.5 rounded-xl bg-white/[0.03] p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">SST / Service tax ({serviceTaxLabelPct}%)</span>
            <span className="text-white">RM {tax.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/5 pt-2 text-base font-bold">
            <span className="text-white">Total</span>
            <span className="text-[#D4AF37]">RM {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { method: "cash", label: "Cash", Icon: Banknote, accent: "emerald" },
            { method: "card", label: "Card", Icon: CreditCard, accent: "blue" },
            { method: "ewallet", label: "E-Wallet", Icon: Smartphone, accent: "purple" },
          ].map(({ method, label, Icon, accent }) => {
            const colorMap: Record<string, string> = {
              emerald: "text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30",
              blue: "text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/30",
              purple: "text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30",
            };
            return (
              <button
                key={method}
                type="button"
                onClick={() => onCheckout(method)}
                disabled={submitting || paymentBlocked}
                className={`group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1e1e] py-3 text-sm font-semibold text-white transition disabled:opacity-40 ${colorMap[accent]}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${colorMap[accent].split(" ")[0]}`} />
                {label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onQrPay}
            disabled={submitting || paymentBlocked}
            className="group col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1e1e] py-3 text-sm font-semibold text-white transition disabled:opacity-40 text-[#D4AF37] group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30"
          >
            <QrCode className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            QR Pay / DuitNow
            <Camera className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]/60" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Service item button ───────────────────────────────────────────────────────

function ServiceBtn({
  name,
  price,
  onClick,
}: {
  name: string;
  price: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between gap-3 rounded-xl border border-white/8 bg-[#161616] p-3.5 text-left transition duration-150 active:scale-[0.96] hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.07] hover:shadow-lg hover:shadow-[#D4AF37]/5"
    >
      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/90 group-hover:text-white">
        {name}
      </p>
      <p className="text-right text-sm font-bold text-[#D4AF37]">RM {price}</p>
    </button>
  );
}

// ─── Product item button ───────────────────────────────────────────────────────

function ProductBtn({
  name,
  price,
  onClick,
}: {
  name: string;
  price: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between gap-3 rounded-xl border border-white/8 bg-[#161616] p-3.5 text-left transition duration-150 active:scale-[0.96] hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.07] hover:shadow-lg hover:shadow-[#D4AF37]/5"
    >
      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/90 group-hover:text-white">
        {name}
      </p>
      <p className="text-right text-sm font-bold text-[#D4AF37]">RM {price}</p>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function safeProofFileName(file: File): string {
  return file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 96) || "receipt.jpg";
}

export function PosPageClient() {
  const t = useT();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { branchId, tenantId } = useTenant();
  const supabase = useSupabase();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: categoriesData } = useServiceCategories();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const { data: staffData } = useStaffMembers();
  const { data: customersData } = useCustomers();
  const { data: queueData } = useQueueTickets();

  const services = servicesData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const inventoryItems = inventoryData?.data ?? [];
  const staffMembers = staffData?.data ?? [];
  const customers = customersData?.data ?? [];

  // Active queue tickets the staff can pick from
  const activeQueueTickets = useMemo(
    () => (queueData?.data ?? []).filter((q) => ["waiting", "in_service"].includes(q.status)),
    [queueData]
  );

  const products = useMemo(
    () => inventoryItems.filter((i) => i.item_type === "retail" && i.is_active && (i.sell_price ?? 0) > 0),
    [inventoryItems]
  );
  const barbers = useMemo(
    () => staffMembers.filter((s) => /barber/i.test(s.role ?? "")),
    [staffMembers]
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const prefillApplied = useRef(false);
  const [linkedQueueTicketId, setLinkedQueueTicketId] = useState<string | null>(
    searchParams.get("queue_ticket_id")
  );
  const [linkedServiceLines, setLinkedServiceLines] = useState<PosLinkedServiceLine[]>([]);
  const [queueDropdownOpen, setQueueDropdownOpen] = useState(false);
  const queueDropdownRef = useRef<HTMLDivElement>(null);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // QR proof photo state
  const [showQrStep, setShowQrStep] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  // Simple payment confirm modal (cash / card / e-wallet)
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<string | null>(null);

  const urlQueueTicketId = searchParams.get("queue_ticket_id");
  const prefillCustomerId = searchParams.get("customer_id");
  const prefillServiceIds = searchParams.getAll("service_id");
  const prefillStaffId = searchParams.get("staff_id");

  // Close queue dropdown on outside click
  useEffect(() => {
    function close(e: MouseEvent) {
      if (queueDropdownRef.current && !queueDropdownRef.current.contains(e.target as Node))
        setQueueDropdownOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /** Build cart items from a queue ticket's services without needing a separate lookup. */
  function cartItemsFromTicket(ticket: QueueTicketWithRelations): CartItem[] {
    const items: CartItem[] = [];
    const seen = new Set<string>();
    if (ticket.ticket_seats.length > 0) {
      for (const seat of ticket.ticket_seats) {
        if (seat.service_id && seat.service && !seen.has(seat.service_id)) {
          seen.add(seat.service_id);
          items.push({ id: seat.service_id, name: seat.service.name, price: seat.service.price, qty: 1, type: "service", serviceId: seat.service_id });
        }
      }
      for (const ms of ticket.member_services) {
        if (!seen.has(ms.service_id)) {
          seen.add(ms.service_id);
          items.push({ id: ms.service_id, name: ms.service_name, price: ms.service_price, qty: 1, type: "service", serviceId: ms.service_id });
        }
      }
    } else if (ticket.member_services.length > 0) {
      for (const ms of ticket.member_services) {
        if (!seen.has(ms.service_id)) {
          seen.add(ms.service_id);
          items.push({ id: ms.service_id, name: ms.service_name, price: ms.service_price, qty: 1, type: "service", serviceId: ms.service_id });
        }
      }
    } else if (ticket.service_id && ticket.service) {
      items.push({ id: ticket.service_id, name: ticket.service.name, price: ticket.service.price, qty: 1, type: "service", serviceId: ticket.service_id });
    }
    return items;
  }

  function applyQueueTicket(ticket: QueueTicketWithRelations) {
    setLinkedQueueTicketId(ticket.id);
    if (ticket.customer_id) setSelectedCustomer(ticket.customer_id);

    const seatLines = buildLinkedServiceLines(ticket);
    if (seatLines.length > 0) {
      setLinkedServiceLines(seatLines);
      setCart((prev) => prev.filter((i) => i.type === "product"));
    } else {
      setLinkedServiceLines([]);
      if (ticket.assigned_staff_id) {
        const idx = barbers.findIndex((b) => b.staff_profile_id === ticket.assigned_staff_id);
        if (idx >= 0) setSelectedBarber(idx);
      }
      const serviceItems = cartItemsFromTicket(ticket);
      setCart((prev) => {
        const products = prev.filter((i) => i.type === "product");
        return [...products, ...serviceItems];
      });
    }
    setQueueDropdownOpen(false);
  }

  function clearQueueLink() {
    setLinkedQueueTicketId(null);
    setLinkedServiceLines([]);
  }

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          !customerSearch ||
          c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone?.includes(customerSearch)
      ),
    [customers, customerSearch]
  );

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services.filter((s) => s.is_active)) {
      const catId = s.category_id ?? "uncategorized";
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId)!.push(s);
    }
    return map;
  }, [services]);

  const isLinkedQueue = Boolean(linkedQueueTicketId) && linkedServiceLines.length > 0;
  const hasUnassignedBarber = isLinkedQueue && linkedServiceLines.some((l) => !l.staffId);
  const linkedServicesTotal = linkedServiceLines.reduce((sum, l) => sum + l.unitPrice, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0) + linkedServicesTotal;
  const tax = Math.round(subtotal * SST_RATE * 100) / 100;
  const total = subtotal + tax;
  const serviceTaxLabelPct = Math.round(SST_RATE * 100);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0) + linkedServiceLines.length;

  const selectedBarberName =
    selectedBarber !== null && barbers[selectedBarber]
      ? barbers[selectedBarber].full_name
      : "Next Available";
  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomer);
  const selectedCustomerName = selectedCustomerObj?.full_name ?? "Walk-in";

  // URL-param prefill (when navigating from queue dashboard "Proceed to payment")
  useEffect(() => {
    if (prefillApplied.current) return;
    if (prefillCustomerId && !customersData) return;
    if (prefillStaffId && !staffData) return;
    if (prefillServiceIds.length > 0 && !servicesData) return;

    if (prefillCustomerId && customers.some((c) => c.id === prefillCustomerId)) {
      setSelectedCustomer(prefillCustomerId);
    }
    if (prefillStaffId) {
      const idx = barbers.findIndex((b) => b.staff_profile_id === prefillStaffId);
      if (idx >= 0) setSelectedBarber(idx);
    }
    if (prefillServiceIds.length > 0) {
      const toAdd: CartItem[] = [];
      for (const sid of prefillServiceIds) {
        // Include inactive services too — service may have been deactivated after check-in
        const service = services.find((s) => s.id === sid);
        if (service) {
          toAdd.push({ id: service.id, name: service.name, price: service.price ?? 0, qty: 1, type: "service", serviceId: service.id });
        }
      }
      if (toAdd.length > 0) {
        setCart(toAdd);
      }
    }

    // If we came from a queue ticket URL, try to apply it from queue data
    if (urlQueueTicketId) {
      if (!queueData) return; // wait for queue data
      const ticket = (queueData.data ?? []).find((q) => q.id === urlQueueTicketId);
      if (ticket) {
        const seatLines = buildLinkedServiceLines(ticket);
        if (seatLines.length > 0) {
          setLinkedServiceLines(seatLines);
          setCart((prev) => prev.filter((i) => i.type === "product"));
        } else if (prefillServiceIds.length === 0) {
          const serviceItems = cartItemsFromTicket(ticket);
          if (serviceItems.length > 0) setCart(serviceItems);
          if (ticket.assigned_staff_id) {
            const idx = barbers.findIndex((b) => b.staff_profile_id === ticket.assigned_staff_id);
            if (idx >= 0) setSelectedBarber(idx);
          }
        }
        if (ticket.customer_id) setSelectedCustomer(ticket.customer_id);
      }
      setLinkedQueueTicketId(urlQueueTicketId);
    }
    prefillApplied.current = true;
  // cartItemsFromTicket is stable (defined in render scope with no deps that change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCustomerId, prefillServiceIds, prefillStaffId, urlQueueTicketId, customersData, staffData, servicesData, queueData, customers, barbers, services]);

  function addToCart(id: string, name: string, price: number, type: "service" | "product", serviceId?: string, inventoryItemId?: string) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === id && i.type === type);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id, name, price, qty: 1, type, serviceId, inventoryItemId }];
    });
  }

  function updateQty(id: string, type: "service" | "product", delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id && i.type === type ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function resetAfterSuccess(method: string) {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["queue-stats"] });

    const receiptServiceItems: CartItem[] = linkedServiceLines.map((l) => ({
      id: l.seatMemberId,
      name: `${l.serviceName}`,
      price: l.unitPrice,
      qty: 1,
      type: "service" as const,
    }));
    const receiptProductItems = cart.filter((i) => i.type === "product");
    const allReceiptItems = isLinkedQueue
      ? [...receiptServiceItems, ...receiptProductItems]
      : [...cart];

    const uniqueBarbers = [...new Set(linkedServiceLines.map((l) => l.staffName))];
    const barberDisplay = isLinkedQueue
      ? uniqueBarbers.join(", ")
      : selectedBarber !== null && barbers[selectedBarber]
        ? barbers[selectedBarber].full_name
        : "Next Available";

    setReceipt({
      items: allReceiptItems,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      customerName: selectedCustomerObj?.full_name ?? "Walk-in",
      barberName: barberDisplay,
      paidAt: new Date().toISOString(),
    });

    setCart([]);
    setLinkedServiceLines([]);
    setShowCheckout(false);
    setShowQrStep(false);
    setShowConfirmStep(false);
    setPendingMethod(null);
    setQrFile(null);
    setQrPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setLinkedQueueTicketId(null);
    setSelectedCustomer(null);
    setSelectedBarber(0);
  }

  async function handleCheckout(method: string, proofStoragePath?: string | null) {
    if (!branchId) return;

    if (isLinkedQueue) {
      if (hasUnassignedBarber) {
        setCheckoutError("All seated members must have a barber assigned before payment.");
        return;
      }
      setCheckoutError(null);
      setSubmitting(true);
      try {
        const result = await createTransactionFromQueueTicket({
          queueTicketId: linkedQueueTicketId!,
          paymentMethod: method,
          products: cart.filter((i) => i.type === "product").map((i) => ({
            inventoryItemId: i.inventoryItemId ?? "",
            name: i.name,
            quantity: i.qty,
            unitPrice: i.price,
            lineTotal: i.price * i.qty,
          })),
          subtotal,
          discountAmount: 0,
          taxAmount: tax,
          totalAmount: total,
          proofStoragePath: proofStoragePath ?? null,
        });
        if (result.success) {
          resetAfterSuccess(method);
        } else {
          setCheckoutError(result.error ?? "Checkout failed");
        }
      } catch {
        setCheckoutError("Checkout failed due to an unexpected server response.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Add at least one item before processing payment.");
      return;
    }
    setCheckoutError(null);
    setSubmitting(true);
    try {
      const staffProfileId =
        selectedBarber !== null && barbers[selectedBarber]
          ? barbers[selectedBarber].staff_profile_id
          : null;

      const result = await createTransaction({
        branchId,
        customerId: selectedCustomer || null,
        queueTicketId: linkedQueueTicketId || null,
        paymentMethod: method,
        items: cart.map((i) => ({
          itemType: i.type,
          serviceId: i.serviceId ?? null,
          inventoryItemId: i.inventoryItemId ?? null,
          staffId: i.type === "service" ? staffProfileId : null,
          name: i.name,
          quantity: i.qty,
          unitPrice: i.price,
          lineTotal: i.price * i.qty,
        })),
        subtotal,
        discountAmount: 0,
        taxAmount: tax,
        totalAmount: total,
        proofStoragePath: proofStoragePath ?? null,
      });

      if (result.success) {
        resetAfterSuccess(method);
      } else {
        setCheckoutError(result.error ?? "Checkout failed");
      }
    } catch {
      setCheckoutError("Checkout failed due to an unexpected server response.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSimplePay(method: string) {
    if (cart.length === 0 && linkedServiceLines.length === 0) {
      setCheckoutError("Add at least one item before processing payment.");
      return;
    }
    setCheckoutError(null);
    setPendingMethod(method);
    setShowConfirmStep(true);
  }

  function handleQrPay() {
    if (cart.length === 0 && linkedServiceLines.length === 0) {
      setCheckoutError("Add at least one item before processing payment.");
      return;
    }
    setCheckoutError(null);
    setQrError(null);
    setQrFile(null);
    setQrPreview(null);
    setShowQrStep(true);
  }

  function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setQrFile(f);
    setQrPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  function clearQrFile() {
    setQrFile(null);
    setQrPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    if (qrFileRef.current) qrFileRef.current.value = "";
  }

  async function confirmQrPayment() {
    if (!qrFile) {
      setQrError("Please take or attach a photo of the QR / transfer receipt.");
      return;
    }
    if (!tenantId) {
      setQrError("Session not ready. Refresh and try again.");
      return;
    }
    setQrError(null);
    setSubmitting(true);
    try {
      const objectPath = `${tenantId}/pos-qr/${globalThis.crypto.randomUUID()}-${safeProofFileName(qrFile)}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(objectPath, qrFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: qrFile.type || "image/jpeg",
      });
      if (uploadError) {
        setQrError(
          uploadError.message.includes("Bucket not found")
            ? "Receipt storage is not set up. Ask an admin to enable the payment-proofs bucket."
            : `Could not upload photo: ${uploadError.message}`
        );
        return;
      }
      await handleCheckout("qr", objectPath);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-400">
        Please select a branch to use POS.
      </div>
    );
  }

  // Customer selector options
  const customerOptions: SelectorOption[] = [
    { value: "__walkin__", label: "Walk-in (no account)" },
    ...filteredCustomers.slice(0, 20).map((c) => ({
      value: c.id,
      label: c.full_name ?? "Unknown",
      sub: c.phone ?? undefined,
    })),
  ];

  // Barber selector options
  const barberOptions: SelectorOption[] = [
    { value: "__next__", label: "Next Available" },
    ...barbers.map((b, i) => ({ value: String(i), label: b.full_name })),
  ];

  const customerValue = selectedCustomer ?? "__walkin__";
  const barberValue = selectedBarber !== null ? String(selectedBarber) : "__next__";

  function handleCustomerChange(v: string) {
    setSelectedCustomer(v === "__walkin__" ? null : v);
  }

  function handleBarberChange(v: string) {
    setSelectedBarber(v === "__next__" ? null : Number(v));
  }

  const orderContentProps: OrderContentProps = {
    cart,
    linkedServiceLines,
    hasUnassignedBarber,
    subtotal,
    tax,
    total,
    serviceTaxLabelPct,
    checkoutError,
    submitting,
    onUpdateQty: updateQty,
    onCheckout: handleSimplePay,
    onQrPay: handleQrPay,
  };

  const linkedTicket = activeQueueTickets.find((q) => q.id === linkedQueueTicketId)
    ?? (queueData?.data ?? []).find((q) => q.id === linkedQueueTicketId);

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:h-[calc(100dvh-5rem-3rem)] lg:flex-row lg:gap-5 lg:overflow-hidden">
      {/* ── Left: catalog ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-28 lg:space-y-4 lg:pb-0 lg:pr-1">

        {/* Queue ticket selector */}
        <div ref={queueDropdownRef} className="relative">
          {linkedTicket ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/8 px-3 py-2.5">
              <Ticket className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-[#D4AF37]">{linkedTicket.queue_number}</span>
                <span className="ml-2 text-sm text-white">{linkedTicket.customer?.full_name ?? "Walk-in"}</span>
                {linkedTicket.party_size > 1 && (
                  <span className="ml-2 text-xs text-gray-400">×{linkedTicket.party_size} cuts</span>
                )}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  linkedTicket.status === "in_service" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"
                }`}>{linkedTicket.status === "in_service" ? "In Service" : "Waiting"}</span>
              </div>
              <button
                type="button"
                onClick={clearQueueLink}
                className="shrink-0 rounded-lg p-1 text-gray-500 hover:text-gray-300 transition"
                title="Unlink queue ticket"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQueueDropdownOpen((p) => !p)}
              className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-sm text-left transition hover:border-[#D4AF37]/30"
            >
              <Ticket className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="flex-1 text-gray-500">Link to queue ticket (optional)</span>
              {activeQueueTickets.length > 0 && (
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                  {activeQueueTickets.length} active
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${queueDropdownOpen ? "rotate-180" : ""}`} />
            </button>
          )}

          {queueDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#222] shadow-2xl shadow-black/60">
              {activeQueueTickets.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No active tickets in queue</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {activeQueueTickets.map((q) => {
                    const serviceNames = q.ticket_seats.length > 0
                      ? [...new Set([
                          ...q.ticket_seats.map((s) => s.service?.name).filter(Boolean),
                          ...q.member_services.map((ms) => ms.service_name),
                        ])].join(", ")
                      : q.member_services.map((ms) => ms.service_name).join(", ") || q.service?.name || "";
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => applyQueueTicket(q)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                      >
                        <span className={`shrink-0 flex items-center justify-center rounded-lg px-2 py-1 text-xs font-black ${
                          q.status === "in_service" ? "bg-blue-500/20 text-blue-400" : "bg-[#D4AF37]/15 text-[#D4AF37]"
                        }`}>{q.queue_number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {q.customer?.full_name ?? "Walk-in"}
                            {q.party_size > 1 && <span className="ml-1.5 text-xs text-gray-500">×{q.party_size}</span>}
                          </p>
                          {serviceNames && <p className="text-[11px] text-gray-500 truncate">{serviceNames}</p>}
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider ${
                          q.status === "in_service" ? "text-blue-400" : "text-orange-400"
                        }`}>{q.status === "in_service" ? "serving" : "waiting"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer + Barber row */}
        <div className={`grid gap-2 ${isLinkedQueue ? "grid-cols-1" : "grid-cols-2"}`}>
          <SelectorDropdown
            icon={User}
            label={t.pos.customer}
            options={customerOptions}
            value={customerValue}
            onChange={handleCustomerChange}
            searchable
            searchValue={customerSearch}
            onSearchChange={setCustomerSearch}
          />
          {isLinkedQueue ? (
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] px-3 py-2.5 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-[#D4AF37]/80">
                <Scissors className="h-3.5 w-3.5" />
                <span className="font-semibold">Barber assigned from queue</span>
              </p>
              <p className="mt-1 text-xs text-gray-400 truncate">
                {[...new Set(linkedServiceLines.map((l) => l.staffName))].join(", ")}
              </p>
            </div>
          ) : (
            <SelectorDropdown
              icon={Scissors}
              label="Barber"
              options={barberOptions}
              value={barberValue}
              onChange={handleBarberChange}
            />
          )}
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-white/5 bg-[#1a1a1a] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              activeTab === "services"
                ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              activeTab === "products"
                ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Products
          </button>
        </div>

        {/* Services catalog */}
        {activeTab === "services" && (
          servicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {categories.filter((c) => c.is_active).map((cat) => {
                const catServices = servicesByCategory.get(cat.id) ?? [];
                if (catServices.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {cat.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {catServices.map((s) => (
                        <ServiceBtn
                          key={s.id}
                          name={s.name}
                          price={s.price ?? 0}
                          onClick={() => addToCart(s.id, s.name, s.price ?? 0, "service", s.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {servicesByCategory.get("uncategorized")?.length ? (
                <div>
                  <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Other
                  </p>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                    {(servicesByCategory.get("uncategorized") ?? []).map((s) => (
                      <ServiceBtn
                        key={s.id}
                        name={s.name}
                        price={s.price ?? 0}
                        onClick={() => addToCart(s.id, s.name, s.price ?? 0, "service", s.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : !categories.some((c) => servicesByCategory.get(c.id)?.length) ? (
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                  {services.filter((s) => s.is_active).map((s) => (
                    <ServiceBtn
                      key={s.id}
                      name={s.name}
                      price={s.price ?? 0}
                      onClick={() => addToCart(s.id, s.name, s.price ?? 0, "service", s.id)}
                    />
                  ))}
                </div>
              ) : null}
              {!servicesLoading && services.filter((s) => s.is_active).length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No services configured yet.</p>
              )}
            </div>
          )
        )}

        {/* Products catalog */}
        {activeTab === "products" && (
          inventoryLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No retail products available.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductBtn
                  key={p.id}
                  name={p.name}
                  price={p.sell_price ?? 0}
                  onClick={() => addToCart(p.id, p.name, p.sell_price ?? 0, "product", undefined, p.id)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Mobile sticky bar ──────────────────────────────────────────── */}
      <div className="fixed bottom-[5.5rem] left-0 right-0 z-20 px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setShowCheckout(true)}
          disabled={cart.length === 0 && linkedServiceLines.length === 0}
          className="flex w-full items-center justify-between rounded-2xl bg-[#D4AF37] px-5 py-3.5 shadow-2xl shadow-black/50 transition active:scale-[0.98] disabled:opacity-40"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-xs font-black text-[#111]">
              {cartCount}
            </span>
            <span className="text-sm font-bold text-[#111]">View order</span>
          </div>
          <span className="text-base font-black text-[#111]">RM {total.toFixed(2)}</span>
        </button>
      </div>

      {/* ── Mobile checkout bottom sheet ───────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCheckout(false)}
            aria-label="Close"
          />
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl border-t border-white/10 bg-[#1a1a1a]"
            style={{ maxHeight: "92dvh" }}
          >
            {/* Sheet header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#D4AF37]" />
                  <h2 className="font-bold text-white">Order summary</h2>
                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">
                    {cartCount}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {isLinkedQueue
                    ? [...new Set(linkedServiceLines.map((l) => l.staffName))].join(", ")
                    : selectedBarberName} • {selectedCustomerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <OrderContent {...orderContentProps} />
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop right sidebar ──────────────────────────────────────── */}
      <div className="hidden h-full min-h-0 w-80 shrink-0 flex-col lg:flex xl:w-88">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/5 bg-[#1a1a1a]">
          <div className="shrink-0 border-b border-white/5 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="font-bold text-white">Current order</h3>
              </div>
              <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">
              {isLinkedQueue
                ? [...new Set(linkedServiceLines.map((l) => l.staffName))].join(", ")
                : selectedBarberName} • {selectedCustomerName}
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <OrderContent {...orderContentProps} />
          </div>
        </div>
      </div>

      {/* ── Cash / Card / E-Wallet confirm overlay ────────────────────── */}
      {showConfirmStep && pendingMethod && (() => {
        const methodMeta: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
          cash:    { label: "Cash",     Icon: Banknote,    color: "text-emerald-400" },
          card:    { label: "Card",     Icon: CreditCard,  color: "text-blue-400"    },
          ewallet: { label: "E-Wallet", Icon: Smartphone,  color: "text-purple-400"  },
        };
        const meta = methodMeta[pendingMethod] ?? { label: pendingMethod, Icon: Wallet, color: "text-[#D4AF37]" };
        return (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => { setShowConfirmStep(false); setPendingMethod(null); }}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex w-full max-w-md flex-col rounded-t-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl sm:rounded-2xl"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <meta.Icon className={`h-4 w-4 ${meta.color}`} />
                  <h2 className="text-base font-bold text-white">{meta.label}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowConfirmStep(false); setPendingMethod(null); }}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col px-4 py-4 gap-4">
                <p className="text-sm text-gray-400">
                  Confirm that the customer has paid before processing.
                </p>

                {/* Order total reminder */}
                <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                  <span className="text-sm text-gray-400">Total to collect</span>
                  <span className="text-lg font-black text-[#D4AF37]">RM {total.toFixed(2)}</span>
                </div>

                {/* Customer + barber summary */}
                <div className="rounded-xl border border-white/5 bg-[#111] px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium text-white">{selectedCustomerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Barber</span>
                    <span className="font-medium text-white">
                      {isLinkedQueue
                        ? [...new Set(linkedServiceLines.map((l) => l.staffName))].join(", ")
                        : selectedBarberName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-white">{cartCount}</span>
                  </div>
                </div>

                {checkoutError && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {checkoutError}
                  </p>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex gap-2 border-t border-white/5 px-4 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowConfirmStep(false); setPendingMethod(null); }}
                  className="flex-1 rounded-xl border border-white/15 bg-transparent py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckout(pendingMethod)}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#111111] transition hover:brightness-110 disabled:opacity-40"
                >
                  {submitting ? "Saving…" : "Confirm payment"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── QR Pay proof capture overlay ──────────────────────────────── */}
      {showQrStep && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => { setShowQrStep(false); setQrError(null); clearQrFile(); }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-proof-title"
            className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col rounded-t-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl sm:rounded-2xl"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#D4AF37]" />
                <h2 id="qr-proof-title" className="text-base font-bold text-white">QR Pay / DuitNow</h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowQrStep(false); setQrError(null); clearQrFile(); }}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 gap-4">
              <p className="text-sm text-gray-400">
                Snap or attach the customer&apos;s QR / DuitNow receipt before confirming payment.
              </p>

              {/* Order total reminder */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                <span className="text-sm text-gray-400">Total to collect</span>
                <span className="text-lg font-black text-[#D4AF37]">RM {total.toFixed(2)}</span>
              </div>

              {/* Photo capture */}
              <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQrFileChange}
              />
              {qrPreview ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <img src={qrPreview} alt="Receipt preview" className="max-h-48 w-full object-contain" />
                  <button
                    type="button"
                    onClick={clearQrFile}
                    className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => qrFileRef.current?.click()}
                  className="flex min-h-[7rem] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-[#111111] text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-medium">Tap to take or choose photo</span>
                  <span className="text-xs text-gray-600">Required for QR / DuitNow payments</span>
                </button>
              )}

              {qrError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {qrError}
                </p>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 border-t border-white/5 px-4 pt-3">
              <button
                type="button"
                onClick={() => { setShowQrStep(false); setQrError(null); clearQrFile(); }}
                className="flex-1 rounded-xl border border-white/15 bg-transparent py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmQrPayment}
                disabled={submitting || !qrFile}
                className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#111111] transition hover:brightness-110 disabled:opacity-40"
              >
                {submitting ? "Saving…" : "Confirm payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ──────────────────────────────────────────────────── */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 rounded-t-2xl bg-[#111] px-6 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Payment Received</h3>
              <p className="text-xs text-gray-500">
                {new Date(receipt.paidAt).toLocaleString("en-MY", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-1 px-6 py-4 text-sm" id="pos-receipt-print">
              <div className="flex justify-between text-gray-400">
                <span>Customer</span>
                <span className="font-medium text-white">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Barber</span>
                <span className="font-medium text-white">{receipt.barberName}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Payment</span>
                <span className="font-medium capitalize text-white">{receipt.paymentMethod === "qr" ? "DuitNow QR" : receipt.paymentMethod}</span>
              </div>
              <div className="my-3 border-t border-white/10" />
              {receipt.items.map((item) => (
                <div key={`${item.id}-${item.type}`} className="flex justify-between text-gray-300">
                  <span className="flex-1 truncate pr-2">{item.name} {item.qty > 1 && <span className="text-gray-500">×{item.qty}</span>}</span>
                  <span>RM {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="my-3 border-t border-white/10" />
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>RM {receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.tax > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>SST ({Math.round(SST_RATE * 100)}%)</span>
                  <span>RM {receipt.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white">
                <span>Total</span>
                <span className="text-[#D4AF37]">RM {receipt.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-white/5 px-6 pb-5 pt-3">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("pos-receipt-print");
                  if (!el) return;
                  const win = window.open("", "_blank", "width=400,height=600");
                  if (!win) return;
                  win.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;padding:16px;background:#fff;color:#000;}div{display:flex;justify-content:space-between;margin:4px 0;font-size:13px;}hr{border:none;border-top:1px dashed #ccc;margin:8px 0;}.total{font-weight:bold;font-size:15px;}</style></head><body>${el.innerHTML}</body></html>`);
                  win.document.close();
                  win.print();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
