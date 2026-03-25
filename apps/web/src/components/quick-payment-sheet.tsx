"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Camera, QrCode, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { recordQuickPayment } from "@/actions/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/components/tenant-provider";
import { useStaffMembers } from "@/hooks";

type QuickPaymentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickPaymentSheet({ open, onOpenChange }: QuickPaymentSheetProps) {
  const queryClient = useQueryClient();
  const { branchId } = useTenant();
  const { data: staffData, isLoading: staffLoading } = useStaffMembers();
  const staffMembers = staffData?.data ?? [];

  const fileRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [staffProfileId, setStaffProfileId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr">("qr");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const barbers = useMemo(() => {
    const active = staffMembers.filter((s) => s.is_active);
    const barberRoles = active.filter((s) => /barber/i.test(s.role ?? ""));
    return barberRoles.length > 0 ? barberRoles : active;
  }, [staffMembers]);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setStaffProfileId("");
    setPaymentMethod("qr");
    setProofFile(null);
    setPreviewUrl(null);
    setError(null);
    setWarning(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [open]);

  useEffect(() => {
    if (!open || staffLoading) return;
    setStaffProfileId(barbers[0]?.staff_profile_id ?? "");
  }, [open, staffLoading, barbers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setProofFile(f ?? null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  function clearPhoto() {
    setProofFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId) {
      setError("No branch selected. Open the full menu and check your account.");
      return;
    }
    const num = Number.parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter the amount the client paid.");
      return;
    }
    if (!staffProfileId) {
      setError("Choose the barber who should get credit for this payment.");
      return;
    }
    if (paymentMethod === "qr" && !proofFile) {
      setError("QR / transfer payments need a photo of the receipt or screenshot.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setWarning(null);
    try {
      const fd = new FormData();
      fd.append("branch_id", branchId);
      fd.append("amount", String(num));
      fd.append("staff_profile_id", staffProfileId);
      fd.append("payment_method", paymentMethod);
      if (proofFile) fd.append("payment_proof", proofFile);

      const result = await recordQuickPayment(fd);
      if (!result || typeof result !== "object") {
        setError("No response from server. Check your connection and try again.");
        return;
      }
      if (result.success) {
        try {
          await queryClient.invalidateQueries({ queryKey: ["transactions"] });
          await queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
        } catch {
          /* cache refresh is best-effort */
        }
        if (result.warning) setWarning(result.warning);
        else onOpenChange(false);
      } else {
        setError(result.error ?? "Could not save payment");
      }
    } catch (err) {
      console.error("recordQuickPayment", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg === "Failed to fetch" || /failed to fetch/i.test(msg)) {
        setError(
          "Could not reach the server—receipt photos are often too large. Try a smaller picture, check your connection, and restart the dev server after config changes (`pnpm dev`)."
        );
      } else {
        setError(msg || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-pay-title"
        className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl sm:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 pr-3">
          <h2 id="quick-pay-title" className="text-lg font-bold text-white">
            Receive payment
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          <p className="mb-4 text-sm text-gray-400">
            Snap the QR or transfer receipt, enter the amount, and pick the barber — done in a few taps.
          </p>

          {!branchId && (
            <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
              You need an active branch to record payments.
            </p>
          )}

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Photo {paymentMethod === "qr" ? "(required)" : "(optional)"}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          {previewUrl ? (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <img src={previewUrl} alt="Payment proof preview" className="max-h-48 w-full object-contain" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mb-4 flex min-h-[7rem] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-[#111111] text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
            >
              <Camera className="h-8 w-8" />
              <span className="text-sm font-medium">Tap to take or choose photo</span>
            </button>
          )}

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Amount (RM)
          </label>
          <Input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mb-4 border-white/10 bg-[#111111] text-white placeholder:text-gray-600"
            autoComplete="off"
          />

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Barber
          </label>
          <select
            value={staffProfileId}
            onChange={(e) => setStaffProfileId(e.target.value)}
            disabled={staffLoading || barbers.length === 0}
            className="mb-4 w-full rounded-md border border-white/10 bg-[#111111] px-3 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            {staffLoading && <option value="">Loading staff…</option>}
            {!staffLoading && barbers.length === 0 && (
              <option value="">No staff — add barbers in Staff</option>
            )}
            {barbers.map((b) => (
              <option key={b.staff_profile_id} value={b.staff_profile_id}>
                {b.full_name}
              </option>
            ))}
          </select>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">How they paid</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("qr")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                paymentMethod === "qr"
                  ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "border-white/10 bg-[#111111] text-gray-400 hover:border-white/20"
              }`}
            >
              <QrCode className="h-4 w-4 shrink-0" />
              QR / transfer
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                paymentMethod === "cash"
                  ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "border-white/10 bg-[#111111] text-gray-400 hover:border-white/20"
              }`}
            >
              <Banknote className="h-4 w-4 shrink-0" />
              Cash
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {warning && (
            <div className="mb-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <p>{warning}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/5"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 font-bold" disabled={submitting || !branchId}>
              {submitting ? "Saving…" : "Save payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
