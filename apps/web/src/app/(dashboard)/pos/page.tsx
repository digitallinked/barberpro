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
import { useState } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const SERVICES = [
  { name: "Premium Cut + Shave", price: 65, duration: "~45 min", icon: "✂️" },
  { name: "Basic Haircut",       price: 35, duration: "~30 min", icon: "💈" },
  { name: "Kids Cut",            price: 25, duration: "~20 min", icon: "👦" },
  { name: "Hair Coloring",       price: 120, duration: "~90 min", icon: "🎨" },
  { name: "Beard Trim",          price: 20, duration: "~15 min", icon: "🪒" },
  { name: "Hair Treatment",      price: 80, duration: "~60 min", icon: "💆" }
];

const PRODUCTS = [
  { name: "Pomade Matte", price: 45, stock: 12 },
  { name: "Hair Wax",     price: 38, stock: 8 },
  { name: "Beard Oil",    price: 55, stock: 15 },
  { name: "Shampoo",      price: 32, stock: 20 }
];

const BARBERS_POS = [
  { name: "Sam",  init: "S", status: "Available",    statusColor: "text-emerald-400" },
  { name: "Zack", init: "Z", status: "Busy",         statusColor: "text-yellow-400" },
  { name: "Ali",  init: "A", status: "Available",    statusColor: "text-emerald-400" }
];

type CartItem = { name: string; price: number; qty: number; type: "service" | "product" };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([
    { name: "Premium Cut + Shave", price: 65, qty: 1, type: "service" },
    { name: "Pomade Matte", price: 45, qty: 1, type: "product" }
  ]);
  const [selectedBarber, setSelectedBarber] = useState(0);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.06 * 100) / 100;
  const total = subtotal + tax;

  function addToCart(name: string, price: number, type: "service" | "product") {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.name === name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { name, price, qty: 1, type }];
    });
  }

  function updateQty(name: string, delta: number) {
    setCart((prev) => prev.map((i) => i.name === name ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-6 overflow-hidden">
      {/* Left – Menu */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {/* Customer search */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2"><User className="h-4 w-4 text-[#D4AF37]" /> Customer</h3>
            <button type="button" className="flex items-center gap-1 text-xs font-medium text-[#D4AF37]"><Plus className="h-3 w-3" /> New</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search by name or phone number..." className="w-full rounded-lg border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" />
          </div>
          <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-2.5 text-sm font-medium text-white transition hover:bg-[#333]">
            <User className="h-4 w-4" /> Continue as Walk-in
          </button>
        </Card>

        {/* Barber selector */}
        <Card className="p-5">
          <h3 className="mb-3 font-bold text-white flex items-center gap-2"><Scissors className="h-4 w-4 text-[#D4AF37]" /> Select Barber</h3>
          <div className="flex gap-3">
            {BARBERS_POS.map((b, i) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedBarber(i)}
                className={`flex flex-col items-center rounded-lg border p-3 transition ${
                  selectedBarber === i ? "border-[#D4AF37]/30 bg-[#D4AF37]/10" : "border-white/5 bg-[#111] hover:border-[#D4AF37]/20"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${selectedBarber === i ? "border-[#D4AF37] bg-[#D4AF37]/20" : "border-white/10 bg-[#2a2a2a]"} mb-2 text-sm font-bold text-white`}>
                  {b.init}
                </div>
                <span className="text-xs font-medium text-white">{b.name}</span>
                <span className={`mt-0.5 text-[10px] ${b.statusColor}`}>{b.status}</span>
              </button>
            ))}
            <button type="button" className="flex flex-col items-center rounded-lg border border-[#D4AF37]/20 p-3 transition hover:border-[#D4AF37]/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 mb-2">
                <Scissors className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-medium text-[#D4AF37]">Next Available</span>
            </button>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-5">
          <h3 className="mb-4 font-bold text-white flex items-center gap-2"><Scissors className="h-4 w-4 text-[#D4AF37]" /> Services</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => addToCart(s.name, s.price, "service")}
                className="group rounded-lg border border-white/5 bg-[#111] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-bold text-white">RM {s.price}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{s.name}</h4>
                <p className="text-xs text-gray-500">{s.duration}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Products */}
        <Card className="p-5">
          <h3 className="mb-4 font-bold text-white flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-[#D4AF37]" /> Retail Products</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => addToCart(p.name, p.price, "product")}
                className="group rounded-lg border border-white/5 bg-[#111] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <ShoppingBag className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-bold text-white">RM {p.price}</span>
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">{p.name}</h4>
                <p className="text-[10px] text-gray-500">In stock: {p.stock}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Right – Order summary */}
      <div className="hidden w-96 shrink-0 flex-col lg:flex">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><Wallet className="h-4 w-4 text-[#D4AF37]" /> Current Order</h3>
              <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">{cart.length} items</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Barber: {BARBERS_POS[selectedBarber].name} • Walk-in Customer</p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cart.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111] p-3 transition hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">RM {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button type="button" onClick={() => updateQty(item.name, -1)} className="flex h-6 w-6 items-center justify-center rounded bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333]">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-white">{item.qty}</span>
                  <button type="button" onClick={() => updateQty(item.name, 1)} className="flex h-6 w-6 items-center justify-center rounded bg-[#2a2a2a] text-gray-400 transition hover:bg-[#333]">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => updateQty(item.name, -item.qty)} className="ml-1 text-red-400 transition hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & payment */}
          <div className="border-t border-white/5 p-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span><span className="text-white">RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax (6%)</span><span className="text-white">RM {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white border-t border-white/5 pt-3">
              <span>Total</span><span className="text-[#D4AF37]">RM {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-3 text-sm font-medium text-white transition hover:bg-[#333]">
                <Banknote className="h-4 w-4 text-emerald-400" /> Cash
              </button>
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-3 text-sm font-medium text-white transition hover:bg-[#333]">
                <CreditCard className="h-4 w-4 text-blue-400" /> Card
              </button>
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-3 text-sm font-medium text-white transition hover:bg-[#333]">
                <Smartphone className="h-4 w-4 text-purple-400" /> E-Wallet
              </button>
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2a2a2a] py-3 text-sm font-medium text-white transition hover:bg-[#333]">
                <QrCode className="h-4 w-4 text-[#D4AF37]" /> QR Pay
              </button>
            </div>

            <button type="button" className="w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110">
              Charge RM {total.toFixed(2)}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
