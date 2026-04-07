"use client";

import { ArrowRight, Lock, MapPin, Plus, Rocket, Store, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/shop-media";
import { useQueryClient } from "@tanstack/react-query";

import { useBranches } from "@/hooks";
import { createBranch } from "@/actions/branches";
import { useTenant } from "@/components/tenant-provider";
import { useT } from "@/lib/i18n/language-context";
import { PlacesAutocomplete } from "@/components/places-autocomplete";

export default function BranchesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useBranches();
  const tenant = useTenant();

  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const branches = data?.data ?? [];
  const isStarter = tenant.tenantPlan === "starter";
  const atBranchLimit = isStarter && branches.length >= 1;

  function handleAddBranchClick() {
    if (atBranchLimit) {
      setShowUpgrade(true);
    } else {
      setShowModal(true);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createBranch(formData);
    setSubmitting(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setShowModal(false);
      form.reset();
    } else {
      setFormError(result.error ?? "Failed to create branch");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.branches.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{t.branches.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleAddBranchClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 sm:w-auto"
          >
            {atBranchLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {t.branches.addBranch}
          </button>
        </div>
      </div>

      {/* Starter plan banner */}
      {isStarter && (
        <div className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-[#D4AF37]" />
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">Starter plan</span> — includes 1 branch.{" "}
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="font-semibold text-[#D4AF37] hover:underline"
            >
              Upgrade to Professional
            </button>{" "}
            for unlimited branches.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            <p className="text-sm text-gray-400">Loading branches...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
          Failed to load branches. Please try again.
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-16 gap-3">
          <Store className="h-10 w-10 text-gray-600" />
          <p className="text-gray-400">No branches found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => {
            const logoUrl = b.logo_url;
            const modeLabel = b.accepts_online_bookings && b.accepts_walkin_queue ? "Bookings & Walk-ins"
              : b.accepts_online_bookings ? "Appointments only"
              : b.accepts_walkin_queue ? "Walk-in only"
              : "Not accepting";
            const modeBadgeColor = b.accepts_online_bookings && b.accepts_walkin_queue ? "bg-emerald-500/10 text-emerald-400"
              : !b.accepts_online_bookings && !b.accepts_walkin_queue ? "bg-red-500/10 text-red-400"
              : "bg-amber-500/10 text-amber-400";
            return (
              <Link
                key={b.id}
                href={`/branches/${b.id}`}
                className="group rounded-xl border border-white/5 bg-[#1a1a1a] p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex items-start gap-3 mb-4">
                  {logoUrl ? (
                    <img src={`${STORAGE_URL}/${logoUrl}`}
                      alt={b.name} className="h-12 w-12 shrink-0 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                      <Store className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      {b.is_hq && (
                        <span className="rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">HQ</span>
                      )}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${b.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {b.is_active ? "Open" : "Closed"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{b.name}</h3>
                    <p className="font-mono text-[11px] text-gray-500">{b.code}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0 text-gray-600" />
                    <span className="truncate">{b.address || "No address set"}</span>
                  </p>
                  {b.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <ArrowRight className="h-3 w-3 shrink-0 text-gray-600" />
                      {b.phone}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${modeBadgeColor}`}>{modeLabel}</span>
                  <span className="text-[11px] text-gray-600 group-hover:text-[#D4AF37] transition">View details →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Upgrade paywall modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="relative my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl text-center">
            <button
              type="button"
              onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
              <Rocket className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white">Upgrade to Professional</h3>
            <p className="mt-2 text-sm text-gray-400">
              Your <span className="font-semibold text-white">Starter plan</span> supports 1 branch.
              Upgrade to <span className="font-semibold text-white">Professional</span> to add unlimited branches and unlock multi-location management.
            </p>
            <ul className="mt-4 space-y-2 text-left">
              {[
                "Unlimited branches",
                "Multi-branch dashboard",
                "Advanced commissions",
                "Expense management",
                "Advanced analytics & P&L",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/settings?tab=billing"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
              >
                Upgrade Now — RM 249/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="rounded-lg py-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal (Professional only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Add Branch</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Name</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Branch name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Code</label>
                <input
                  name="code"
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. KL01"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="+60..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="branch@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Address</label>
                <PlacesAutocomplete
                  placeholder="Search address…"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
