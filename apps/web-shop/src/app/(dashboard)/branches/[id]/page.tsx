"use client";

import { ArrowLeft, Clock, MapPin, Mail, Phone, Store, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useBranch, useStaffMembers } from "@/hooks";

export default function BranchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: branchData, isLoading: branchLoading, error: branchError } = useBranch(id);
  const { data: staffData } = useStaffMembers();

  const branch = branchData?.data ?? null;
  const staffMembers = staffData?.data ?? [];
  const branchStaff = branch ? staffMembers.filter((s) => s.branch_id === branch.id) : [];

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

  return (
    <div className="space-y-6">
      <Link
        href="/branches"
        className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </Link>

      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#D4AF37]/10">
              <Store className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
                {branch.is_hq && (
                  <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-bold text-[#D4AF37]">
                    HQ
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    branch.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {branch.is_active ? "Open" : "Closed"}
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
