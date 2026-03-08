import { CalendarCheck2, Clock, Plus } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Appointments</h2>
          <p className="mt-1 text-sm text-gray-400">Manage booking schedules and appointments</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
          <Plus className="h-4 w-4" /> New Appointment
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] py-24">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
          <CalendarCheck2 className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Appointments Coming Soon</h3>
        <p className="max-w-md text-center text-sm text-gray-400">
          Online booking, calendar views, and appointment management are being built. Stay tuned for an integrated scheduling experience.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 px-4 py-2 text-xs font-medium text-[#D4AF37]">
          <Clock className="h-3.5 w-3.5" /> In development
        </div>
      </div>
    </div>
  );
}
