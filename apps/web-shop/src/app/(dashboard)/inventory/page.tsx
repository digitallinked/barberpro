"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Package,
  Pencil,
  Plus,
  Search,
  TrendingUp
} from "lucide-react";
import { useInventoryItems, useInventoryStats, useSuppliers } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { createInventoryItem, updateInventoryItem, adjustStock } from "@/actions/inventory";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function formatAmount(n: number) {
  return `RM ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function getStockStatus(stock: number, reorder: number): "ok" | "low" | "critical" {
  if (stock < reorder) return "critical";
  if (stock === reorder) return "low";
  return "ok";
}

function StockBar({ stock, reorder, status }: { stock: number; reorder: number; status: "ok" | "low" | "critical" }) {
  const max = Math.max(stock, reorder, 1);
  const pct = Math.min((stock / max) * 100, 100);
  const color = status === "critical" ? "bg-red-500" : status === "low" ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={`text-xs font-bold ${
          status === "critical" ? "text-red-400" : status === "low" ? "text-yellow-400" : "text-emerald-400"
        }`}
      >
        {stock}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: inventoryResult, isLoading: inventoryLoading } = useInventoryItems();
  const { data: statsResult, isLoading: statsLoading } = useInventoryStats();
  const { data: suppliersResult } = useSuppliers();
  const suppliers = suppliersResult?.data ?? [];

  type EditableItem = {
    id: string; name: string; sku: string | null; item_type: string;
    unit_cost: number; sell_price: number | null; stock_qty: number; reorder_level: number;
    supplier_id: string | null;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<{ id: string; name: string } | null>(null);
  const [editItem, setEditItem] = useState<EditableItem | null>(null);
  const [pending, setPending] = useState(false);
  const [adjustPending, setAdjustPending] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const itemsData = inventoryResult?.data ?? [];
  const inventoryError = inventoryResult?.error;
  const stats = statsResult?.data ?? { totalItems: 0, lowStock: 0 };

  const totalValue = itemsData.reduce((sum, i) => sum + (i.stock_qty ?? 0) * (i.unit_cost ?? 0), 0);
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  let filtered = itemsData;
  if (search) {
    filtered = filtered.filter(
      (i) =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (lowStockOnly) {
    filtered = filtered.filter((i) => (i.stock_qty ?? 0) <= (i.reorder_level ?? 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createInventoryItem(fd);
    setPending(false);
    if (result.success) {
      setShowAddModal(false);
      e.currentTarget.reset();
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    } else {
      alert(result.error);
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjustPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const quantity = Number(fd.get("quantity") ?? 0);
    const direction = fd.get("direction") as "in" | "out";
    const reason = (fd.get("reason") as string) || "Manual adjustment";

    const movementType = direction === "in" ? "adjustment_in" : "adjustment_out";
    const qty = Math.abs(quantity);
    if (qty <= 0) {
      setAdjustPending(false);
      alert("Quantity must be greater than 0");
      return;
    }

    const result = await adjustStock(adjustItem.id, qty, movementType, reason);
    setAdjustPending(false);
    if (result.success) {
      setAdjustItem(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    } else {
      alert(result.error);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    setEditPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateInventoryItem(editItem.id, fd);
    setEditPending(false);
    if (result.success) {
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    } else {
      alert(result.error);
    }
  }

  const STATS = [
    { label: "Total Items", value: stats.totalItems.toString(), icon: Package, iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { label: "Low Stock", value: stats.lowStock.toString(), icon: AlertTriangle, iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400" },
    { label: "Total Value", value: formatAmount(totalValue), icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white">{t.inventory.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.inventory.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white transition hover:border-[#D4AF37]/40 sm:w-auto"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`p-5 ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{statsLoading || inventoryLoading ? "…" : s.value}</h3>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search items, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-gray-400 hover:text-white">
              Type <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setLowStockOnly((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${
                lowStockOnly
                  ? "border border-red-500/40 bg-red-500/20 text-red-400"
                  : "border border-red-500/20 bg-red-500/10 text-red-400 hover:text-red-300"
              }`}
            >
              <AlertTriangle className="h-3 w-3" /> Low Stock
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="sm:hidden divide-y divide-white/[0.04]">
          {inventoryLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : inventoryError ? (
            <div className="p-8 text-center text-red-400">Failed to load inventory</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No items found</div>
          ) : (
            filtered.map((item) => {
              const status = getStockStatus(item.stock_qty ?? 0, item.reorder_level ?? 0);
              const stock = item.stock_qty ?? 0;
              const reorder = item.reorder_level ?? 0;
              return (
                <div key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium text-white">{item.name}</p>
                    <span
                      className={`shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${
                        status === "critical"
                          ? "border-red-500/20 bg-red-500/10 text-red-400"
                          : status === "low"
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {status === "critical" ? "Critical" : status === "low" ? "Low" : "In Stock"}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="shrink-0 rounded border border-white/10 px-2 py-0.5 capitalize text-gray-300">
                      {item.item_type}
                    </span>
                    <span className="text-gray-500">·</span>
                    <span className="min-w-0 truncate font-mono text-gray-500">{item.sku ?? "—"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <StockBar stock={stock} reorder={reorder} status={status} />
                    <span className="text-xs text-gray-400">
                      Stock: {stock} / Reorder: {reorder}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span>{formatAmount(item.unit_cost ?? 0)}</span>
                    <span className="mx-1.5 text-gray-600">·</span>
                    <span className="text-white">
                      {item.sell_price != null ? formatAmount(item.sell_price) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setAdjustItem({ id: item.id, name: item.name })}
                      className="rounded px-2 py-0.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      Adjust Stock
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditItem({
                          id: item.id,
                          name: item.name,
                          sku: item.sku ?? null,
                          item_type: item.item_type,
                          unit_cost: item.unit_cost ?? 0,
                          sell_price: item.sell_price ?? null,
                          stock_qty: item.stock_qty ?? 0,
                          reorder_level: item.reorder_level ?? 0,
                          supplier_id: item.supplier_id ?? null,
                        })
                      }
                      className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">SKU</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-left">Reorder</th>
                <th className="p-4 text-left">Unit Cost</th>
                <th className="p-4 text-left">Sell Price</th>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : inventoryError ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-red-400">Failed to load inventory</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">No items found</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const status = getStockStatus(item.stock_qty ?? 0, item.reorder_level ?? 0);
                  return (
                    <tr key={item.id} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-white">{item.name}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{item.sku ?? "—"}</td>
                      <td className="p-4 text-gray-300 capitalize">{item.item_type}</td>
                      <td className="p-4">
                        <StockBar stock={item.stock_qty ?? 0} reorder={item.reorder_level ?? 0} status={status} />
                      </td>
                      <td className="p-4 text-gray-300">{item.reorder_level ?? 0}</td>
                      <td className="p-4 text-gray-300">{formatAmount(item.unit_cost ?? 0)}</td>
                      <td className="p-4 font-bold text-white">
                        {item.sell_price != null ? formatAmount(item.sell_price) : "—"}
                      </td>
                      <td className="p-4 text-gray-300">{item.supplier_id ? (supplierMap[item.supplier_id] ?? "—") : "—"}</td>
                      <td className="p-4">
                        <span
                          className={`rounded border px-2 py-0.5 text-xs font-bold ${
                            status === "critical"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : status === "low"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {status === "critical" ? "Critical" : status === "low" ? "Low" : "In Stock"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdjustItem({ id: item.id, name: item.name })}
                            className="rounded px-2 py-0.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10"
                          >
                            Adjust Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditItem({
                              id: item.id, name: item.name, sku: item.sku ?? null,
                              item_type: item.item_type, unit_cost: item.unit_cost ?? 0,
                              sell_price: item.sell_price ?? null, stock_qty: item.stock_qty ?? 0,
                              reorder_level: item.reorder_level ?? 0,
                              supplier_id: item.supplier_id ?? null,
                            })}
                            className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Add Item</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Name *</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">SKU</label>
                <input
                  name="sku"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="SKU-0001"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Type *</label>
                <select
                  name="item_type"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="retail">Retail</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>
              {suppliers.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Supplier</label>
                  <select
                    name="supplier_id"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">— None —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Unit Cost</label>
                  <input
                    name="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Sell Price</label>
                  <input
                    name="sell_price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Stock Qty</label>
                  <input
                    name="stock_qty"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Reorder Level</label>
                  <input
                    name="reorder_level"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
                >
                  {pending ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Adjust Stock — {adjustItem.name}</h3>
            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Direction</label>
                <select
                  name="direction"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                >
                  <option value="in">Add stock (+)</option>
                  <option value="out">Remove stock (-)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Quantity *</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Reason</label>
                <input
                  name="reason"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. Restock, Damaged"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustPending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
                >
                  {adjustPending ? "Saving…" : "Adjust"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold text-white">Edit Item — {editItem.name}</h3>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Name *</label>
                <input name="name" required defaultValue={editItem.name}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">SKU</label>
                <input name="sku" defaultValue={editItem.sku ?? ""}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Type *</label>
                <select name="item_type" required defaultValue={editItem.item_type}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]">
                  <option value="retail">Retail</option>
                  <option value="consumable">Consumable</option>
                </select>
              </div>
              {suppliers.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Supplier</label>
                  <select
                    name="supplier_id"
                    defaultValue={editItem.supplier_id ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">— None —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Unit Cost</label>
                  <input name="unit_cost" type="number" step="0.01" min="0" defaultValue={editItem.unit_cost}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Sell Price</label>
                  <input name="sell_price" type="number" step="0.01" min="0" defaultValue={editItem.sell_price ?? ""}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Stock Qty</label>
                  <input name="stock_qty" type="number" min="0" defaultValue={editItem.stock_qty}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Reorder Level</label>
                  <input name="reorder_level" type="number" min="0" defaultValue={editItem.reorder_level}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditItem(null)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={editPending}
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50">
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
