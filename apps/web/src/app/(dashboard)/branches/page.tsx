"use client";

import { Clock, MapPin, Plus, Store, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useBranches } from "@/hooks";
import { createBranch } from "@/actions/branches";

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useBranches();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const branches = data?.data ?? [];

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
          <h2 className="text-2xl font-bold text-white">Branches</h2>
          <p className="mt-1 text-sm text-gray-400">Manage multi-branch operations and locations</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

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
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {branches.map((b) => (
            <Link
              key={b.id}
              href={`/branches/${b.id}`}
              className="rounded-xl border border-white/5 bg-[#1a1a1a] p-5 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Store className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div className="flex items-center gap-2">
                  {b.is_hq && (
                    <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                      HQ
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {b.is_active ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-white">{b.name}</h3>
              <p className="mt-1 text-xs text-gray-500 font-mono">{b.code}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" /> {b.address || "No address"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-xl">
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
                <textarea
                  name="address"
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Full address"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  name="is_hq"
                  type="checkbox"
                  value="true"
                  id="is_hq"
                  className="h-4 w-4 rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="is_hq" className="text-sm text-gray-300">
                  Is HQ
                </label>
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
