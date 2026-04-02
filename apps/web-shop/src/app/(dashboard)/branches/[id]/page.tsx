"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Clock, MapPin, Mail, Phone, Store, User, CalendarCheck, Hash, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useBranch, useStaffMembers } from "@/hooks";
import { updateBranchMode } from "@/actions/branches";

function ModeToggle({
  label,
  description,
  enabled,
  onChange,
  icon: Icon,
  enabledColor = "bg-[#D4AF37]",
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  icon: React.ElementType;
  enabledColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-[#111] p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-[#D4AF37]/15" : "bg-white/5"}`}>
          <Icon className={`h-4 w-4 ${enabled ? "text-[#D4AF37]" : "text-gray-500"}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${enabled ? "text-white" : "text-gray-400"}`}>{label}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? enabledColor : "bg-white/10"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

export default function BranchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { data: branchData, isLoading: branchLoading, error: branchError } = useBranch(id);
  const { data: staffData } = useStaffMembers();

  const branch = branchData?.data ?? null;
  const staffMembers = staffData?.data ?? [];
  const branchStaff = branch ? staffMembers.filter((s) => s.branch_id === branch.id) : [];

  const [acceptsOnline, setAcceptsOnline] = useState<boolean | null>(null);
  const [acceptsWalkin, setAcceptsWalkin] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modeSuccess, setModeSuccess] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  // Initialize toggles from server data (only once)
  const effectiveOnline = acceptsOnline ?? branch?.accepts_online_bookings ?? true;
  const effectiveWalkin = acceptsWalkin ?? branch?.accepts_walkin_queue ?? true;

  function handleModeChange(field: "online" | "walkin", value: boolean) {
    if (field === "online") setAcceptsOnline(value);
    else setAcceptsWalkin(value);

    const newOnline = field === "online" ? value : effectiveOnline;
    const newWalkin = field === "walkin" ? value : effectiveWalkin;

    setModeError(null);
    setModeSuccess(false);

    startTransition(async () => {
      const result = await updateBranchMode(id, newOnline, newWalkin);
      if (result.success) {
        setModeSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["branch", id] });
        setTimeout(() => setModeSuccess(false), 3000);
      } else {
        setModeError(result.error ?? "Failed to save");
        // revert
        if (field === "online") setAcceptsOnline(!value);
        else setAcceptsWalkin(!value);
      }
    });
  }

  if (branchLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
          <p className="text-sm text-gray-400">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (branchError || !branch) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        <p>Branch not found.</p>
        <Link href="/branches" className="mt-4 inline-flex items-center gap-1 text-sm text-[#D4AF37] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Branches
        </Link>
      </div>
    );
  }

  const operatingHours = branch.operating_hours as Record<string, string> | null;
  const hoursDisplay = operatingHours && Object.keys(operatingHours).length > 0
    ? Object.entries(operatingHours)
        .map(([day, hrs]) => `${day}: ${hrs}`)
        .join(" • ")
    : "Not set";

  // Determine mode label
  const modeLabel = effectiveOnline && effectiveWalkin
    ? "Accepting bookings & walk-ins"
    : effectiveOnline
    ? "Appointments only"
    : effectiveWalkin
    ? "Walk-in queue only"
    : "Not accepting customers";

  const modeBadgeColor = effectiveOnline && effectiveWalkin
    ? "bg-emerald-500/10 text-emerald-400"
    : !effectiveOnline && !effectiveWalkin
    ? "bg-red-500/10 text-red-400"
    : "bg-amber-500/10 text-amber-400";

  return (
    <div className="space-y-6">
      <Link
        href="/branches"
        className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </Link>

      {/* Branch header */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#D4AF37]/10">
              <Store className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
                {branch.is_hq && (
                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">HQ</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${branch.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {branch.is_active ? "Open" : "Closed"}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${modeBadgeColor}`}>
                  {modeLabel}
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-gray-500">{branch.code}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            {branch.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Address</p>
                  <p className="text-sm text-white">{branch.address}</p>
                </div>
              </div>
            )}
            {branch.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-white">{branch.phone}</p>
                </div>
              </div>
            )}
            {branch.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <p className="text-sm text-white">{branch.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Operating Hours</p>
                <p className="text-sm text-white">{hoursDisplay}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking mode settings */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Booking Mode</h2>
            <p className="mt-1 text-sm text-gray-400">
              Control which channels customers can use to visit this branch. Changes take effect immediately.
            </p>
          </div>
          {isPending && (
            <div className="flex h-6 w-6 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            </div>
          )}
        </div>

        {modeSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Mode saved successfully.
          </div>
        )}
        {modeError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {modeError}
          </div>
        )}

        {!effectiveOnline && !effectiveWalkin && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span><strong>Warning:</strong> Both modes are off — this branch is not accepting any customers.</span>
          </div>
        )}

        <div className="space-y-3">
          <ModeToggle
            label="Accept online appointments"
            description="Customers can book a specific date and time via the BarberPro website."
            enabled={effectiveOnline}
            onChange={(v) => handleModeChange("online", v)}
            icon={CalendarCheck}
          />
          <ModeToggle
            label="Accept walk-in queue"
            description="Customers can join the walk-in queue via QR scan or the BarberPro app."
            enabled={effectiveWalkin}
            onChange={(v) => handleModeChange("walkin", v)}
            icon={Hash}
          />
        </div>

        <div className="mt-5 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Appointments only</strong> — ideal for busy shops that want full scheduling control.<br />
            <strong className="text-gray-400">Walk-in only</strong> — ideal for shops that serve customers on a first-come, first-served basis.<br />
            <strong className="text-gray-400">Both enabled</strong> — customers can choose their preferred way to visit.
          </p>
        </div>
      </div>

      {/* Staff */}
      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <User className="h-5 w-5 text-[#D4AF37]" /> Staff at this Branch ({branchStaff.length})
        </h2>
        {branchStaff.length === 0 ? (
          <p className="text-sm text-gray-500">No staff assigned to this branch yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {branchStaff.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-lg border border-white/5 bg-[#111] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
                  {s.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-white">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
