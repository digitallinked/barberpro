"use client";

import { useState } from "react";
import { Edit2, Loader2, Save, Settings, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useBranchContext } from "@/components/branch-context";
import { updateBranch, deleteBranch } from "@/actions/branches";
import { PlacesAutocomplete } from "@/components/places-autocomplete";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function parseHours(raw: Record<string, unknown> | null): Record<string, { open: string; close: string; closed: boolean }> {
  const result: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of DAYS) {
    const entry = raw?.[day] ?? raw?.[day.toLowerCase()];
    if (!entry) {
      result[day] = { open: "09:00", close: "22:00", closed: false };
    } else if (typeof entry === "object" && entry !== null) {
      const h = entry as { open?: string; close?: string; closed?: boolean };
      result[day] = { open: h.open ?? "09:00", close: h.close ?? "22:00", closed: h.closed ?? false };
    } else if (typeof entry === "string") {
      if (entry.toLowerCase() === "closed") {
        result[day] = { open: "09:00", close: "22:00", closed: true };
      } else {
        const parts = entry.split(" - ");
        result[day] = { open: parts[0] ?? "09:00", close: parts[1] ?? "22:00", closed: false };
      }
    } else {
      result[day] = { open: "09:00", close: "22:00", closed: false };
    }
  }
  return result;
}

function serializeHours(hours: Record<string, { open: string; close: string; closed: boolean }>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const day of DAYS) {
    const h = hours[day];
    result[day] = h?.closed ? "Closed" : `${h?.open ?? "09:00"} - ${h?.close ?? "18:00"}`;
  }
  return result;
}

export default function BranchSettingsPage() {
  const branch = useBranchContext();
  const queryClient = useQueryClient();

  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [hours, setHours] = useState(() => parseHours(branch.operating_hours as Record<string, unknown> | null));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);
    setEditPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("operating_hours", JSON.stringify(serializeHours(hours)));
    const result = await updateBranch(branch.id, fd);
    setEditPending(false);
    if (result.success) {
      setEditSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["branch-by-slug"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setTimeout(() => setEditSuccess(false), 3000);
    } else {
      setEditError(result.error ?? "Failed to update branch");
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-white">
        <Settings className="h-5 w-5 text-[#D4AF37]" /> Branch Settings
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {editError && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{editError}</div>
        )}
        {editSuccess && (
          <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">Settings saved successfully.</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch Name <span className="text-red-400">*</span></label>
            <input name="name" required defaultValue={branch.name}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Branch Code <span className="text-red-400">*</span></label>
            <input name="code" required defaultValue={branch.code}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-[#D4AF37]" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Phone</label>
            <input name="phone" type="tel" defaultValue={branch.phone ?? ""}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
            <input name="email" type="email" defaultValue={branch.email ?? ""}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Address</label>
          <PlacesAutocomplete placeholder="Search address…" defaultValue={branch.address ?? ""}
            className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" />
        </div>

        {/* Operating Hours */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">Operating Hours</label>
          <div className="space-y-2 rounded-xl border border-white/5 bg-[#111] p-3">
            {DAYS.map((day) => {
              const h = hours[day]!;
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-gray-400">{day.slice(0, 3)}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!h.closed}
                      onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, closed: !e.target.checked } }))}
                      className="h-3.5 w-3.5 rounded accent-[#D4AF37]" />
                    <span className="text-xs text-gray-400">{h.closed ? "Closed" : "Open"}</span>
                  </label>
                  {!h.closed && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input type="time" value={h.open}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, open: e.target.value } }))}
                        className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]" />
                      <span className="text-xs text-gray-600">–</span>
                      <input type="time" value={h.close}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day]!, close: e.target.value } }))}
                        className="rounded border border-white/10 bg-[#0a0a0a] px-2 py-1 text-xs text-white outline-none focus:border-[#D4AF37]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={editPending}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#111] transition hover:brightness-110 disabled:opacity-50">
            {editPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
