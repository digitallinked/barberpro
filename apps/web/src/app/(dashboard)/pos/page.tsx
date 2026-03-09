"use client";

import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Scissors,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  User,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import {
  useServices,
  useServiceCategories,
  useInventoryItems,
  useStaffMembers,
  useCustomers
} from "@/hooks";
import { useTenant } from "@/components/tenant-provider";
import { createTransaction } from "@/actions/pos";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  type: "service" | "product";
  serviceId?: string;
  inventoryItemId?: string;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

export default function PosPage() {
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
    () =>
      inventoryItems.filter(
        (i) => i.item_type === "retail" && i.is_active && (i.sell_price ?? 0) > 0
      ),
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
          (c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.phone?.includes(customerSearch))
      ),
    [customers, customerSearch]
  );

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.06 * 100) / 100;
  const total = subtotal + tax;

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services.filter((s) => s.is_active)) {
      const catId = s.category_id ?? "uncategorized";
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId)!.push(s);
    }
    return map;
  }, [services]);

  useEffect(() => {
    if (prefillApplied) return;
    if (prefillCustomerId && !customersData) return;
    if (prefillStaffId && !staffData) return;
    if (prefillServiceId && !servicesData) return;

    if (prefillCustomerId && customers.some((c) => c.id === prefillCustomerId)) {
      setSelectedCustomer(prefillCustomerId);
    }

    if (prefillStaffId) {
      const barberIdx = barbers.findIndex((b) => b.staff_profile_id === prefillStaffId);
      if (barberIdx >= 0) {
        setSelectedBarber(barberIdx);
      }
    }

    if (prefillServiceId) {
      const service = services.find((s) => s.id === prefillServiceId && s.is_active);
      if (service) {
        setCart((prev) => {
          const exists = prev.some((i) => i.type === "service" && i.serviceId === service.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: service.id,
              name: service.name,
              price: service.price ?? 0,
              qty: 1,
              type: "service",
              serviceId: service.id
            }
          ];
        });
      }
    }

    setPrefillApplied(true);
  }, [
    prefillApplied,
    prefillCustomerId,
    prefillServiceId,
    prefillStaffId,
    customersData,
    staffData,
    servicesData,
    customers,
    barbers,
    services
  ]);

  function addToCart(
    id: string,
    name: string,
    price: number,
    type: "service" | "product",
    serviceId?: string,
    inventoryItemId?: string
  ) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === id && i.type === type);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id,
          name,
          price,
          qty: 1,
          type,
          serviceId,
          inventoryItemId
        }
      ];
    });
  }

  function updateQty(id: string, type: "service" | "product", delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id && i.type === type ? { ...i, qty: Math.max(0, i.qty + delta) } : i
        )
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

      const items = cart.map((i) => ({
        itemType: i.type,
        serviceId: i.serviceId ?? null,
        inventoryItemId: i.inventoryItemId ?? null,
        staffId: i.type === "service" ? staffProfileId : null,
        name: i.name,
        quantity: i.qty,
        unitPrice: i.price,
        lineTotal: i.price * i.qty
      }));

      const result = await createTransaction({
        branchId,
        customerId: selectedCustomer || null,
        queueTicketId: queueTicketId || null,
        paymentMethod: method,
        items,
        subtotal,
        discountAmount: 0,
        taxAmount: tax,
        totalAmount: total
      });

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
        setCart([]);
      } else {
        setCheckoutError(result.error ?? "Checkout failed");
      }
    } catch {
      setCheckoutError("Checkout failed due to an unexpected server response.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBarberName =
    selectedBarber !== null && barbers[selectedBarber]
      ? barbers[selectedBarber].full_name
      : "Next Available";
  const selectedCustomerName = selectedCustomer
    ? customers.find((c) => c.id === selectedCustomer)?.full_name ?? "Walk-in"
    : "Walk-in";

  if (!branchId) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-400">
        Please select a branch to use POS.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-6 overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-[#D4AF37]" /> Customer
            </h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {filteredCustomers.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCustomer(selectedCustomer === c.id ? null : c.id);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedCustomer === c.id
                    ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {c.full_name} {c.phone && `• ${c.phone}`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedCustomer(null)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
          >
            <User className="h-4 w-4" /> Continue as Walk-in
          </button>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold text-white flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#D4AF37]" /> Select Barber
          </h3>
          <div className="flex flex-wrap gap-3">
            {barbers.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBarber(i)}
                className={`flex flex-col items-center rounded-lg border p-3 transition ${
                  selectedBarber === i
                    ? "border-[#D4AF37]/30 bg-[#D4AF37]/10"
                    : "border-white/5 bg-[#111] hover:border-[#D4AF37]/20"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 mb-2 text-sm font-bold text-white ${
                    selectedBarber === i ? "border-[#D4AF37] bg-[#D4AF37]/20" : "border-white/10 bg-[#2a2a2a]"
                  }`}
                >
                  {b.full_name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-white">{b.full_name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedBarber(null)}
              className={`flex flex-col items-center rounded-lg border p-3 transition ${
                selectedBarber === null
                  ? "border-[#D4AF37]/30 bg-[#D4AF37]/10"
                  : "border-[#D4AF37]/20 hover:border-[#D4AF37]/40"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 mb-2">
                <Scissors className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-medium text-[#D4AF37]">Next Available</span>
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold text-white flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#D4AF37]" /> Services
          </h3>
          {servicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {categories.length > 0
                ? categories
                    .filter((c) => c.is_active)
                    .map((cat) => {
                      const catServices = servicesByCategory.get(cat.id) ?? [];
                      if (catServices.length === 0) return null;
                      return (
                        <div key={cat.id}>
                          <p className="mb-2 text-xs font-medium text-gray-500">{cat.name}</p>
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                            {catServices.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() =>
                                  addToCart(s.id, s.name, s.price ?? 0, "service", s.id)
                                }
                                className="group rounded-lg border border-white/5 bg-[#111] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xl">✂️</span>
                                  <span className="text-sm font-bold text-white">
                                    RM {s.price ?? 0}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">{s.name}</h4>
                                <p className="text-xs text-gray-500">
                                  ~{s.duration_min ?? 30} min
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                : null}
              {servicesByCategory.get("uncategorized")?.length ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Other</p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {(servicesByCategory.get("uncategorized") ?? []).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addToCart(s.id, s.name, s.price ?? 0, "service", s.id)}
                        className="group rounded-lg border border-white/5 bg-[#111] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xl">✂️</span>
                          <span className="text-sm font-bold text-white">RM {s.price ?? 0}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{s.name}</h4>
                        <p className="text-xs text-gray-500">~{s.duration_min ?? 30} min</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : !categories.some((c) => servicesByCategory.get(c.id)?.length) && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {services
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addToCart(s.id, s.name, s.price ?? 0, "service", s.id)}
                        className="group rounded-lg border border-white/5 bg-[#111] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xl">✂️</span>
                          <span className="text-sm font-bold text-white">RM {s.price ?? 0}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{s.name}</h4>
                        <p className="text-xs text-gray-500">~{s.duration_min ?? 30} min</p>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#D4AF37]" /> Retail Products
          </h3>
          {inventoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    addToCart(
                      p.id,
                      p.name,
                      p.sell_price ?? 0,
                      "product",
                      undefined,
                      p.id
                    )
                  }
                  className="group rounded-lg border border-white/5 bg-[#111] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-1">
                    <ShoppingBag className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-bold text-white">
                      RM {p.sell_price ?? 0}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{p.name}</h4>
                  <p className="text-[10px] text-gray-500">In stock: {p.stock_qty}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="hidden w-96 shrink-0 flex-col lg:flex">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#D4AF37]" /> Current Order
              </h3>
              <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">
                {cart.length} items
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Barber: {selectedBarberName} • {selectedCustomerName}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.type}`}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111] p-3 transition hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">RM {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.type, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333]"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-white">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.type, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, item.type, -item.qty)}
                    className="ml-1 text-red-400 transition hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 p-5 space-y-3">
            {checkoutError && (
              <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {checkoutError}
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span className="text-white">RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax (6%)</span>
              <span className="text-white">RM {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white border-t border-white/5 pt-3">
              <span>Total</span>
              <span className="text-[#D4AF37]">RM {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { method: "cash", label: "Cash", Icon: Banknote, color: "text-emerald-400" },
                { method: "card", label: "Card", Icon: CreditCard, color: "text-blue-400" },
                { method: "ewallet", label: "E-Wallet", Icon: Smartphone, color: "text-purple-400" },
                { method: "qr", label: "QR Pay", Icon: QrCode, color: "text-[#D4AF37]" }
              ].map(({ method, label, Icon, color }) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleCheckout(method)}
                  disabled={submitting || cart.length === 0}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-3 text-sm font-medium text-white transition hover:bg-[#333] disabled:opacity-50"
                >
                  <Icon className={`h-4 w-4 ${color}`} /> {label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
