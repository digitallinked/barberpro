"use client";

import {
  Banknote,
  ChevronDown,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Scissors,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
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
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { createTransaction } from "@/actions/pos";
import { useT } from "@/lib/i18n/language-context";
import { SST_RATE } from "@/lib/malaysian-tax";

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
  subtotal: number;
  tax: number;
  total: number;
  serviceTaxLabelPct: number;
  checkoutError: string | null;
  submitting: boolean;
  onUpdateQty: (id: string, type: "service" | "product", delta: number) => void;
  onCheckout: (method: string) => void;
};

function OrderContent({
  cart,
  subtotal,
  tax,
  total,
  serviceTaxLabelPct,
  checkoutError,
  submitting,
  onUpdateQty,
  onCheckout,
}: OrderContentProps) {
  return (
    <>
      {/* Line items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
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
            { method: "qr", label: "QR Pay", Icon: QrCode, accent: "yellow" },
          ].map(({ method, label, Icon, accent }) => {
            const colorMap: Record<string, string> = {
              emerald: "text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30",
              blue: "text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/30",
              purple: "text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30",
              yellow: "text-[#D4AF37] group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30",
            };
            return (
              <button
                key={method}
                type="button"
                onClick={() => onCheckout(method)}
                disabled={submitting || cart.length === 0}
                className={`group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1e1e] py-3 text-sm font-semibold text-white transition disabled:opacity-40 ${colorMap[accent]}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${colorMap[accent].split(" ")[0]}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Service item button ───────────────────────────────────────────────────────

function ServiceBtn({
  name,
  price,
  duration,
  onClick,
}: {
  name: string;
  price: number;
  duration: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-1.5 rounded-xl border border-white/5 bg-[#111] p-3 text-left transition active:scale-[0.97] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-base leading-none">✂️</span>
        <span className="text-xs font-bold text-white">RM {price}</span>
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{name}</p>
      <p className="text-[11px] text-gray-500">~{duration} min</p>
    </button>
  );
}

// ─── Product item button ───────────────────────────────────────────────────────

function ProductBtn({
  name,
  price,
  stock,
  onClick,
}: {
  name: string;
  price: number;
  stock: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-1.5 rounded-xl border border-white/5 bg-[#111] p-3 text-left transition active:scale-[0.97] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
    >
      <div className="flex items-start justify-between gap-1">
        <ShoppingBag className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-bold text-white">RM {price}</span>
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{name}</p>
      <p className="text-[11px] text-gray-500">Stock: {stock}</p>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PosPageClient() {
  const t = useT();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { branchId } = useTenant();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: categoriesData } = useServiceCategories();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const { data: staffData } = useStaffMembers();
  const { data: customersData } = useCustomers();

  const services = servicesData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const inventoryItems = inventoryData?.data ?? [];
  const staffMembers = staffData?.data ?? [];
  const customers = customersData?.data ?? [];

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
  const [prefillApplied, setPrefillApplied] = useState(false);

  const queueTicketId = searchParams.get("queue_ticket_id");
  const prefillCustomerId = searchParams.get("customer_id");
  const prefillServiceId = searchParams.get("service_id");
  const prefillStaffId = searchParams.get("staff_id");

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

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * SST_RATE * 100) / 100;
  const total = subtotal + tax;
  const serviceTaxLabelPct = Math.round(SST_RATE * 100);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const selectedBarberName =
    selectedBarber !== null && barbers[selectedBarber]
      ? barbers[selectedBarber].full_name
      : "Next Available";
  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomer);
  const selectedCustomerName = selectedCustomerObj?.full_name ?? "Walk-in";

  useEffect(() => {
    if (prefillApplied) return;
    if (prefillCustomerId && !customersData) return;
    if (prefillStaffId && !staffData) return;
    if (prefillServiceId && !servicesData) return;

    if (prefillCustomerId && customers.some((c) => c.id === prefillCustomerId)) {
      setSelectedCustomer(prefillCustomerId);
    }
    if (prefillStaffId) {
      const idx = barbers.findIndex((b) => b.staff_profile_id === prefillStaffId);
      if (idx >= 0) setSelectedBarber(idx);
    }
    if (prefillServiceId) {
      const service = services.find((s) => s.id === prefillServiceId && s.is_active);
      if (service) {
        setCart((prev) => {
          if (prev.some((i) => i.type === "service" && i.serviceId === service.id)) return prev;
          return [
            ...prev,
            { id: service.id, name: service.name, price: service.price ?? 0, qty: 1, type: "service", serviceId: service.id },
          ];
        });
      }
    }
    setPrefillApplied(true);
  }, [prefillApplied, prefillCustomerId, prefillServiceId, prefillStaffId, customersData, staffData, servicesData, customers, barbers, services]);

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

  async function handleCheckout(method: string) {
    if (!branchId || cart.length === 0) return;
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
        queueTicketId: queueTicketId || null,
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
      });

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
        setCart([]);
        setShowCheckout(false);
      } else {
        setCheckoutError(result.error ?? "Checkout failed");
      }
    } catch {
      setCheckoutError("Checkout failed due to an unexpected server response.");
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
    subtotal,
    tax,
    total,
    serviceTaxLabelPct,
    checkoutError,
    submitting,
    onUpdateQty: updateQty,
    onCheckout: handleCheckout,
  };

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:h-[calc(100dvh-5rem-3rem)] lg:flex-row lg:gap-5 lg:overflow-hidden">
      {/* ── Left: catalog ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-28 lg:space-y-4 lg:pb-0 lg:pr-1">

        {/* Customer + Barber row */}
        <div className="grid grid-cols-2 gap-2">
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
          <SelectorDropdown
            icon={Scissors}
            label="Barber"
            options={barberOptions}
            value={barberValue}
            onChange={handleBarberChange}
          />
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
            <ShoppingBag className="h-3.5 w-3.5" />
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
                          duration={s.duration_min ?? 30}
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
                        duration={s.duration_min ?? 30}
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
                      duration={s.duration_min ?? 30}
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
                  stock={p.stock_qty ?? 0}
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
          disabled={cart.length === 0}
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
                  {selectedBarberName} • {selectedCustomerName}
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
              {selectedBarberName} • {selectedCustomerName}
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <OrderContent {...orderContentProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
