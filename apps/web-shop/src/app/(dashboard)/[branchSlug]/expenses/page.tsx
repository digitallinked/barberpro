"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart2,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useExpenses, useExpenseStats } from "@/hooks";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/components/tenant-provider";
import { useT } from "@/lib/i18n/language-context";
import { createExpense, updateExpense, deleteExpense, updateExpenseStatus } from "@/actions/expenses";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  "Utilities",
  "Supplies",
  "Rent",
  "Salaries",
  "Marketing",
  "Equipment",
  "Maintenance",
  "Transportation",
  "Insurance",
  "Food & Beverages",
  "Software & Subscriptions",
  "Professional Services",
  "Taxes & Fees",
  "Miscellaneous",
];

const DEFAULT_VENDORS = [
  "TNB (Tenaga Nasional)",
  "Syabas / Air Selangor",
  "Unifi / TM",
  "Maxis",
  "Celcom",
  "Digi",
  "Lazada",
  "Shopee",
  "Grab",
  "Touch 'n Go",
];

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "duitnow_qr", label: "DuitNow QR" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  Utilities: "bg-blue-500/10 text-blue-400",
  Supplies: "bg-purple-500/10 text-purple-400",
  Rent: "bg-orange-500/10 text-orange-400",
  Salaries: "bg-green-500/10 text-green-400",
  Marketing: "bg-pink-500/10 text-pink-400",
  Equipment: "bg-cyan-500/10 text-cyan-400",
  Maintenance: "bg-yellow-500/10 text-yellow-400",
  Transportation: "bg-indigo-500/10 text-indigo-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/5 bg-[#1a1a1a] ${className}`}>{children}</div>;
}

function formatAmount(amount: number) {
  return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatPaymentMethod(method: string) {
  return method.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-[#D4AF37]/10 text-[#D4AF37]";
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 96) || "receipt.jpg";
}

// ─── Combobox ──────────────────────────────────────────────────────────────────

function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  allowCustom = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );
  const exactMatch = options.some((o) => o.toLowerCase() === query.toLowerCase());

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setAddingNew(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(opt: string) {
    onChange(opt);
    setOpen(false);
    setQuery("");
  }

  function handleAddNew() {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    select(trimmed);
    setAddingNew(false);
    setNewValue("");
  }

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-400">
        {label} {required && <span className="text-[#D4AF37]">*</span>}
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37] hover:border-white/20 transition-colors"
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value || placeholder || `Select ${label}`}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl">
          <div className="border-b border-white/5 p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-white/10 bg-[#111] py-1.5 pl-7 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && !allowCustom && (
              <li className="px-3 py-2 text-xs text-gray-500">No options found</li>
            )}
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => select(opt)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${value === opt ? "text-[#D4AF37] font-medium" : "text-white"}`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
          {allowCustom && !exactMatch && (
            <div className="border-t border-white/5 p-2">
              {addingNew ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNew())}
                    placeholder="Enter new option..."
                    autoFocus
                    className="flex-1 rounded-md border border-[#D4AF37]/40 bg-[#111] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="rounded-md bg-[#D4AF37] px-2 py-1 text-xs font-bold text-[#111]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingNew(false)}
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingNew(true); setNewValue(query); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {query ? `Add "${query}"` : "Add new option"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Receipt Upload ────────────────────────────────────────────────────────────

function ReceiptUpload({
  value,
  onChange,
  onPreview,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  onPreview: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-400">
        Receipt Photo <span className="text-gray-600">(optional)</span>
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {onPreview ? (
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#111]">
          <img
            src={onPreview}
            alt="Receipt preview"
            className="h-40 w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 backdrop-blur-sm">
            <span className="text-xs text-gray-300 truncate max-w-[140px]">{value?.name ?? "receipt"}</span>
            <button
              type="button"
              onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="ml-2 rounded-full bg-red-500/20 p-1 text-red-400 hover:bg-red-500/30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#111] px-4 py-5 text-center hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors"
        >
          <Camera className="h-6 w-6 text-gray-500" />
          <div>
            <p className="text-xs font-medium text-gray-300">Tap to take or choose photo</p>
            <p className="text-[10px] text-gray-600 mt-0.5">JPG, PNG, PDF up to 5 MB</p>
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Existing Receipt Link ─────────────────────────────────────────────────────

function ExistingReceiptBadge({
  storagePath,
  supabase,
}: {
  storagePath: string;
  supabase: ReturnType<typeof useSupabase>;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage
      .from("expense-receipts")
      .createSignedUrl(storagePath, 300)
      .then(({ data }) => data?.signedUrl && setUrl(data.signedUrl));
  }, [storagePath, supabase]);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#111] px-2 py-1 text-xs text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors"
    >
      <Receipt className="h-3 w-3" />
      View Receipt
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ─── Row Action Menu ───────────────────────────────────────────────────────────

type ExpenseRowData = {
  id: string;
  status: string | null;
  receipt_url: string | null;
  category: string;
  vendor: string | null;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string | null;
};

function RowMenu({
  expense,
  onEdit,
  onDelete,
  onStatusChange,
  supabase,
  deletingId,
}: {
  expense: ExpenseRowData;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: "paid" | "pending") => void;
  supabase: ReturnType<typeof useSupabase>;
  deletingId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = expense.status ?? "pending";

  useEffect(() => {
    if (open && expense.receipt_url && !receiptUrl) {
      supabase.storage
        .from("expense-receipts")
        .createSignedUrl(expense.receipt_url, 300)
        .then(({ data }) => data?.signedUrl && setReceiptUrl(data.signedUrl));
    }
  }, [open, expense.receipt_url, receiptUrl, supabase]);

  // Position the portal menu using fixed coords (viewport-relative, ignores all overflow/z-index parents)
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 208; // w-52
    const menuHeight = 190;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight ? rect.bottom + 6 : rect.top - menuHeight - 6;
    const left = Math.max(8, rect.right - menuWidth);
    setMenuStyle({ position: "fixed", top, left, width: menuWidth });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideBtn = btnRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideBtn && !insideMenu) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="z-[9999] overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] shadow-2xl shadow-black/60"
    >
      {status === "pending" ? (
        <button
          type="button"
          onClick={() => { onStatusChange("paid"); setOpen(false); }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Mark as Paid
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { onStatusChange("pending"); setOpen(false); }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors"
        >
          <Clock className="h-4 w-4 shrink-0" />
          Mark as Pending
        </button>
      )}

      <div className="mx-3 border-t border-white/5" />

      <button
        type="button"
        onClick={() => { onEdit(); setOpen(false); }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
      >
        <Pencil className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        Edit Expense
      </button>

      {expense.receipt_url && (
        <a
          href={receiptUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
        >
          <Receipt className="h-4 w-4 shrink-0 text-gray-400" />
          View Receipt
          <ExternalLink className="ml-auto h-3 w-3 text-gray-600" />
        </a>
      )}

      <div className="mx-3 border-t border-white/5" />

      <button
        type="button"
        onClick={() => { onDelete(); setOpen(false); }}
        disabled={!!deletingId}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        Delete
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          open ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-white"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && createPortal(menu, document.body)}
    </>
  );
}

// ─── Category Summary (Annual) ─────────────────────────────────────────────────

function CategorySummary({ expenses }: { expenses: Array<{ category: string; amount: number; expense_date: string }> }) {
  const currentYear = new Date().getFullYear();
  const yearExpenses = expenses.filter((e) => new Date(e.expense_date).getFullYear() === currentYear);

  const byCategory: Record<string, number> = {};
  for (const e of yearExpenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  }

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  if (sorted.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-4 w-4 text-[#D4AF37]" />
        <h3 className="font-bold text-white text-sm">Annual Category Breakdown ({currentYear})</h3>
      </div>
      <div className="space-y-2.5">
        {sorted.map(([cat, amt]) => {
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${getCategoryColor(cat)}`}>{cat}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                  <span className="text-xs font-semibold text-white">{formatAmount(amt)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D4AF37]/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-white/5 pt-3 flex justify-between">
        <span className="text-xs text-gray-400">Total ({currentYear})</span>
        <span className="text-sm font-bold text-white">{formatAmount(total)}</span>
      </div>
    </Card>
  );
}

// ─── Expense Form ──────────────────────────────────────────────────────────────

type ExpenseFormValues = {
  category: string;
  vendor: string;
  amount: string;
  payment_method: string;
  expense_date: string;
  notes: string;
  receipt_url: string;
};

function ExpenseForm({
  initial,
  categories,
  vendors,
  pending,
  onSubmit,
  onCancel,
  submitLabel,
  supabase,
  tenantId,
}: {
  initial: ExpenseFormValues;
  categories: string[];
  vendors: string[];
  pending: boolean;
  onSubmit: (values: ExpenseFormValues, receiptStoragePath: string | null) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  supabase: ReturnType<typeof useSupabase>;
  tenantId: string;
}) {
  const [values, setValues] = useState<ExpenseFormValues>(initial);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function set(k: keyof ExpenseFormValues, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function handleReceiptChange(file: File | null) {
    setReceiptFile(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let storagePath: string | null = values.receipt_url || null;

    if (receiptFile) {
      setUploading(true);
      try {
        const filename = `${Date.now()}_${sanitizeFilename(receiptFile.name)}`;
        const objectPath = `${tenantId}/expenses/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(objectPath, receiptFile, { upsert: true, contentType: receiptFile.type || "image/jpeg" });
        if (uploadError) throw new Error(uploadError.message);
        storagePath = objectPath;
      } catch (err) {
        alert(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSubmit(values, storagePath);
  }

  const isLoading = pending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Combobox
        label="Category"
        value={values.category}
        onChange={(v) => set("category", v)}
        options={categories}
        placeholder="e.g. Utilities, Supplies"
        required
        allowCustom
      />

      <Combobox
        label="Vendor"
        value={values.vendor}
        onChange={(v) => set("vendor", v)}
        options={vendors}
        placeholder="Vendor name (optional)"
        allowCustom
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Amount <span className="text-[#D4AF37]">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">RM</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Payment Method <span className="text-[#D4AF37]">*</span>
          </label>
          <select
            required
            value={values.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Date <span className="text-[#D4AF37]">*</span>
          </label>
          <input
            type="date"
            required
            value={values.expense_date}
            onChange={(e) => set("expense_date", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Notes</label>
        <textarea
          rows={2}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37] resize-none"
          placeholder="Optional notes"
        />
      </div>

      <ReceiptUpload
        value={receiptFile}
        onChange={handleReceiptChange}
        onPreview={receiptPreview}
      />

      {values.receipt_url && !receiptFile && (
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#111] px-3 py-2">
          <Receipt className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-400 flex-1 truncate">Existing receipt attached</span>
          <button
            type="button"
            onClick={() => set("receipt_url", "")}
            className="text-red-400 hover:text-red-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !values.category || !values.amount}
          className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {isLoading ? (uploading ? "Uploading…" : "Saving…") : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type EditExpense = {
  id: string;
  category: string;
  vendor: string | null;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string | null;
  receipt_url: string | null;
};

export default function ExpensesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { tenantId } = useTenant();
  const { data: expensesResult, isLoading: expensesLoading } = useExpenses();
  const { data: statsResult, isLoading: statsLoading } = useExpenseStats();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<EditExpense | null>(null);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCategorySummary, setShowCategorySummary] = useState(false);

  const expensesData = expensesResult?.data ?? [];
  const expensesError = expensesResult?.error;
  const stats = statsResult?.data ?? { total: 0, thisMonth: 0 };

  // Derive unique categories and vendors from existing data + defaults
  const existingCategories = Array.from(new Set(expensesData.map((e) => e.category).filter(Boolean)));
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  const existingVendors = Array.from(new Set(expensesData.map((e) => e.vendor).filter(Boolean) as string[]));
  const vendors = Array.from(new Set([...DEFAULT_VENDORS, ...existingVendors])).sort();

  const allCategories = Array.from(new Set(expensesData.map((e) => e.category)));

  const pendingExpenses = expensesData.filter((e) => (e.status ?? "pending") === "pending");
  const paidTotal = expensesData
    .filter((e) => e.status === "paid")
    .reduce((s, e) => s + (e.amount ?? 0), 0);
  const pendingTotal = pendingExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const filtered = expensesData.filter((e) => {
    const matchSearch = !search || [e.category, e.vendor, e.notes].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchCat = !filterCategory || e.category === filterCategory;
    const matchStatus = !filterStatus || (e.status ?? "pending") === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const emptyFormValues: ExpenseFormValues = {
    category: "",
    vendor: "",
    amount: "",
    payment_method: "cash",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
    receipt_url: "",
  };

  const handleAddSubmit = useCallback(async (values: ExpenseFormValues, storagePath: string | null) => {
    setPending(true);
    const fd = new FormData();
    fd.set("category", values.category);
    fd.set("vendor", values.vendor);
    fd.set("amount", values.amount);
    fd.set("payment_method", values.payment_method);
    fd.set("expense_date", values.expense_date);
    fd.set("notes", values.notes);
    if (storagePath) fd.set("receipt_url", storagePath);
    const result = await createExpense(fd);
    setPending(false);
    if (result.success) {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }, [queryClient]);

  const handleEditSubmit = useCallback(async (values: ExpenseFormValues, storagePath: string | null) => {
    if (!editExpense) return;
    setPending(true);
    const fd = new FormData();
    fd.set("category", values.category);
    fd.set("vendor", values.vendor);
    fd.set("amount", values.amount);
    fd.set("payment_method", values.payment_method);
    fd.set("expense_date", values.expense_date);
    fd.set("notes", values.notes);
    // Always send receipt_url so the server knows whether to update it:
    // - new path string = new upload
    // - empty string = user cleared it
    // - key not present = don't touch it (handled server-side by checking null key)
    fd.set("receipt_url", storagePath ?? values.receipt_url ?? "");
    const result = await updateExpense(editExpense.id, fd);
    setPending(false);
    if (result.success) {
      setEditExpense(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }, [editExpense, queryClient]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    const result = await deleteExpense(id);
    setDeletingId(null);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }

  async function handleStatusChange(id: string, status: "paid" | "pending") {
    const result = await updateExpenseStatus(id, status);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    } else {
      alert(result.error);
    }
  }

  const STATS = [
    { label: "Total Paid", value: formatAmount(paidTotal), icon: CircleDollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", sub: "all-time paid" },
    { label: "This Month", value: formatAmount(stats.thisMonth), icon: BarChart2, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", sub: "paid only" },
    { label: "Pending Payment", value: formatAmount(pendingTotal), icon: Clock, iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400", sub: `${pendingExpenses.length} expense${pendingExpenses.length !== 1 ? "s" : ""}` },
    { label: "All Time (any status)", value: formatAmount(expensesData.reduce((s, e) => s + (e.amount ?? 0), 0)), icon: Tag, iconBg: "bg-white/5", iconColor: "text-gray-400", sub: `${expensesData.length} records` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white">{t.expenses.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.expenses.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowCategorySummary((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40 sm:w-auto transition-colors"
          >
            <Tag className="h-4 w-4 text-[#D4AF37]" />
            Annual Summary
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white hover:border-[#D4AF37]/40 sm:w-auto transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 sm:w-auto transition-all"
          >
            <Plus className="h-4 w-4" /> {t.expenses.addExpense}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.iconBg}`}><Icon className={`h-4 w-4 ${s.iconColor}`} /></span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">{statsLoading ? "…" : s.value}</h3>
              <p className="mt-1 text-[11px] text-gray-600">{s.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Pending approval alert */}
      {pendingExpenses.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-400">
              {pendingExpenses.length} expense{pendingExpenses.length !== 1 ? "s" : ""} pending payment
              <span className="ml-2 font-normal text-yellow-400/70">({formatAmount(pendingTotal)})</span>
            </p>
            <p className="text-xs text-yellow-400/60 mt-0.5">
              Only paid expenses appear in P&L reports and stats. Mark them as paid below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className="shrink-0 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            Review
          </button>
        </div>
      )}

      {/* Annual Category Summary */}
      {showCategorySummary && (
        <CategorySummary expenses={expensesData} />
      )}

      {/* Table */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-white">All Expenses</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#D4AF37] sm:w-40"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#111] py-1.5 pl-2 pr-6 text-xs text-gray-400 outline-none focus:border-[#D4AF37]"
            >
              <option value="">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#111] py-1.5 pl-2 pr-6 text-xs text-gray-400 outline-none focus:border-[#D4AF37]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-white/[0.04]">
          {expensesLoading ? (
            <div className="px-5 py-8 text-center text-gray-500">Loading...</div>
          ) : expensesError ? (
            <div className="px-5 py-8 text-center text-red-400">Failed to load expenses</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500">No expenses found</div>
          ) : (
            filtered.map((e) => (
              <div key={e.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${getCategoryColor(e.category)}`}>{e.category}</span>
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold ${getStatusStyle(e.status ?? "pending")}`}>
                        {e.status ?? "pending"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-red-400">- {formatAmount(e.amount)}</p>
                    <p className="text-xs text-gray-400">
                      {e.vendor ?? "—"} · {formatDate(e.expense_date)}
                    </p>
                    <p className="text-xs text-gray-600">{formatPaymentMethod(e.payment_method)}</p>
                  </div>
                  <RowMenu
                    expense={e}
                    onEdit={() => setEditExpense({ id: e.id, category: e.category, vendor: e.vendor ?? null, amount: e.amount, payment_method: e.payment_method, expense_date: e.expense_date, notes: e.notes ?? null, receipt_url: e.receipt_url ?? null })}
                    onDelete={() => handleDelete(e.id)}
                    onStatusChange={(status) => handleStatusChange(e.id, status)}
                    supabase={supabase}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Vendor</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Notes</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {expensesLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : expensesError ? (
                <tr><td colSpan={8} className="p-8 text-center text-red-400">Failed to load expenses</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No expenses found</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className={`border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group ${(e.status ?? "pending") === "pending" ? "bg-yellow-500/[0.02]" : ""}`}>
                    <td className="p-4">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${getCategoryColor(e.category)}`}>{e.category}</span>
                    </td>
                    <td className="p-4 font-medium text-white">{e.vendor ?? <span className="text-gray-600">—</span>}</td>
                    <td className="p-4 text-right font-bold text-red-400">- {formatAmount(e.amount)}</td>
                    <td className="p-4 text-gray-300">{formatPaymentMethod(e.payment_method)}</td>
                    <td className="p-4 text-gray-300">{formatDate(e.expense_date)}</td>
                    <td className="p-4">
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold ${getStatusStyle(e.status ?? "pending")}`}>
                        {e.status ?? "pending"}
                      </span>
                    </td>
                    <td className="p-4 max-w-[140px]">
                      <span className="block truncate text-xs text-gray-400" title={e.notes ?? ""}>{e.notes ?? <span className="text-gray-600">—</span>}</span>
                    </td>
                    <td className="p-3 text-right">
                      <RowMenu
                        expense={e}
                        onEdit={() => setEditExpense({ id: e.id, category: e.category, vendor: e.vendor ?? null, amount: e.amount, payment_method: e.payment_method, expense_date: e.expense_date, notes: e.notes ?? null, receipt_url: e.receipt_url ?? null })}
                        onDelete={() => handleDelete(e.id)}
                        onStatusChange={(status) => handleStatusChange(e.id, status)}
                        supabase={supabase}
                        deletingId={deletingId}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {expensesData.length} expenses</p>
          <div className="flex gap-1">
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 hover:border-white/20 hover:text-white transition-colors">Previous</button>
            <button type="button" className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 hover:border-white/20 hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Add Expense</h3>
                <p className="text-xs text-gray-500 mt-0.5">Record a new business expense</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                initial={emptyFormValues}
                categories={categories}
                vendors={vendors}
                pending={pending}
                onSubmit={handleAddSubmit}
                onCancel={() => setShowAddModal(false)}
                submitLabel="Add Expense"
                supabase={supabase}
                tenantId={tenantId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editExpense && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Expense</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update expense details</p>
              </div>
              <button type="button" onClick={() => setEditExpense(null)} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                initial={{
                  category: editExpense.category,
                  vendor: editExpense.vendor ?? "",
                  amount: String(editExpense.amount),
                  payment_method: editExpense.payment_method,
                  expense_date: editExpense.expense_date,
                  notes: editExpense.notes ?? "",
                  receipt_url: editExpense.receipt_url ?? "",
                }}
                categories={categories}
                vendors={vendors}
                pending={pending}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditExpense(null)}
                submitLabel="Save Changes"
                supabase={supabase}
                tenantId={tenantId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
