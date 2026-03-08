import { Clock, Scissors, Star, Users } from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const NOW_SERVING = {
  number: "Q2",
  name: "Tan Wei Liang",
  barber: "Sam",
  chair: "Chair 1",
  service: "Premium Cut",
  timer: "20:00"
};

const NEXT_IN_LINE = [
  { number: "Q3", name: "Kumar s/o Rajan", service: "Kids Cut", wait: "18 min" },
  { number: "Q4", name: "Ahmad Fauzi", service: "Premium Cut + Shave", wait: "25 min" }
];

const WAITING = [
  { number: "Q5", name: "Walk-in Guest", service: "Basic Cut", wait: "12 min" },
  { number: "Q6", name: "Hafiz Rahman", service: "Beard Trim", wait: "8 min" },
  { number: "Q7", name: "Jason Lee", service: "Hair Coloring", wait: "5 min" },
  { number: "Q8", name: "David Tan", service: "Basic Cut", wait: "2 min" }
];

// ─── Page (full-screen TV display, outside dashboard shell) ────────────────────

export default function QueueBoardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] p-6 font-sans text-white lg:p-10">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Scissors className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              BarberPro<span className="text-[#D4AF37]">.my</span>
            </h1>
            <p className="text-sm font-medium text-gray-400">KL Sentral HQ Branch</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-5 w-5" />
          <span className="text-lg font-medium tabular-nums">{new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        {/* Now Serving – takes up 1/3 */}
        <div className="flex flex-col">
          <div className="flex-1 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent p-8">
            <p className="text-lg font-bold uppercase tracking-widest text-white/80 mb-4">Now Serving</p>
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#D4AF37] text-6xl font-black text-[#0a0a0a] shadow-2xl shadow-[#D4AF37]/30">
                {NOW_SERVING.number}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white/90">Barber: {NOW_SERVING.barber}</p>
              <p className="text-base font-medium text-white/70">{NOW_SERVING.chair}</p>
              <div className="mt-4">
                <p className="text-sm font-bold uppercase tracking-wider text-white/80 mb-1">Service</p>
                <p className="text-2xl font-black text-white">{NOW_SERVING.service}</p>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37]/20 px-4 py-2">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xl font-bold tabular-nums text-[#D4AF37]">{NOW_SERVING.timer}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next in Line + Waiting Queue – takes up 2/3 */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Next in Line */}
          <div>
            <h2 className="mb-4 text-2xl font-black uppercase tracking-wide text-white">Next in Line</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {NEXT_IN_LINE.map((q, i) => (
                <div key={q.number} className={`rounded-xl border p-5 ${i === 0 ? "border-orange-500/30 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-black ${i === 0 ? "bg-orange-500 text-white" : "bg-[#1a1a1a] border border-white/10 text-gray-400"}`}>
                      {q.number}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{q.name}</p>
                      <p className="text-sm text-gray-400">{q.service}</p>
                      <p className="mt-1 text-sm font-medium text-orange-400">~{q.wait} wait</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Queue */}
          <div>
            <h2 className="mb-4 text-2xl font-black uppercase tracking-wide text-white">
              Waiting Queue <span className="text-lg font-normal text-gray-500">({WAITING.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {WAITING.map((q) => (
                <div key={q.number} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] text-lg font-bold text-gray-400">
                    {q.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{q.name}</p>
                    <p className="text-xs text-gray-500">{q.service}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{q.wait}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VIP banner */}
          <div className="mt-auto rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-white flex items-center gap-2"><Star className="h-5 w-5 text-[#D4AF37]" /> Become a VIP Member Today!</p>
                <p className="text-sm text-gray-400">Get 20% off all services + priority booking</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Starting from</p>
                <p className="text-3xl font-black text-[#D4AF37]">RM 99<span className="text-lg text-gray-400">/month</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
