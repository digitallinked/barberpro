"use client";

import { useEffect, useState } from "react";
import { Save, Scale } from "lucide-react";

const SST_SETTINGS_KEY = "barberpro:sst";

type SstSettings = {
  registered: boolean;
  sstNumber: string;
  registeredSince: string;
  sstRateOverride: string;
};

function loadSstSettings(): SstSettings {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SST_SETTINGS_KEY) : null;
    if (raw) return JSON.parse(raw) as SstSettings;
  } catch {
    /* ignore */
  }
  return { registered: false, sstNumber: "", registeredSince: "", sstRateOverride: "8" };
}

function saveSstSettings(s: SstSettings) {
  try {
    localStorage.setItem(SST_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function WorkspaceTaxPage() {
  const [sstSettings, setSstSettings] = useState<SstSettings>({
    registered: false,
    sstNumber: "",
    registeredSince: "",
    sstRateOverride: "8",
  });
  const [sstSaved, setSstSaved] = useState(false);

  useEffect(() => {
    setSstSettings(loadSstSettings());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-white">Tax &amp; Compliance (Malaysia)</h2>
          </div>
          <p className="text-sm text-gray-400">SST registration details and compliance reference.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            saveSstSettings(sstSettings);
            setSstSaved(true);
            setTimeout(() => setSstSaved(false), 3000);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 sm:w-auto"
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </div>

      {sstSaved && (
        <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          Tax settings saved to this browser.
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
        <div className="space-y-6 max-w-lg">
          {/* SST registration */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-300">Service Tax (SST) registration</p>
            <label className="flex cursor-pointer items-center gap-3">
              <div
                role="switch"
                aria-checked={sstSettings.registered}
                onClick={() => setSstSettings((s) => ({ ...s, registered: !s.registered }))}
                className={`relative h-6 w-11 rounded-full transition ${sstSettings.registered ? "bg-[#D4AF37]" : "bg-white/10"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    sstSettings.registered ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300">
                {sstSettings.registered
                  ? "Registered for SST"
                  : "Not registered (below RM500k threshold)"}
              </span>
            </label>
            <p className="mt-1 text-[11px] text-gray-600">
              SST threshold: RM500,000 annual taxable turnover. Register at{" "}
              <a
                href="https://mysst.customs.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4AF37] underline"
              >
                MySSTCustoms
              </a>
              .
            </p>
          </div>

          {sstSettings.registered && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  SST registration number
                </label>
                <input
                  type="text"
                  value={sstSettings.sstNumber}
                  onChange={(e) => setSstSettings((s) => ({ ...s, sstNumber: e.target.value }))}
                  placeholder="W10-XXXX-XXXXXXX"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Registered since (date)
                </label>
                <input
                  type="date"
                  value={sstSettings.registeredSince}
                  onChange={(e) =>
                    setSstSettings((s) => ({ ...s, registeredSince: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </>
          )}

          {/* SST rate reference */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="mb-1 text-sm font-semibold text-[#D4AF37]">Current SST rate: 8%</p>
            <p className="text-xs text-gray-400">
              Effective 1 March 2024. Previously 6%. Applied automatically on POS, queue payment, and
              quick payment transactions.
            </p>
          </div>

          {/* MY statutory reference */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-white">Statutory contribution reference</p>
            <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-400">
              <span className="font-medium text-gray-300">EPF employee</span>
              <span>11% (&lt;60) / 5.5% (≥60)</span>
              <span className="font-medium text-gray-300">EPF employer</span>
              <span>13% (≤RM5k) / 12% (&gt;RM5k)</span>
              <span className="font-medium text-gray-300">SOCSO (insurable cap)</span>
              <span>Employee 0.5%, Employer 1.75% (≤RM5k)</span>
              <span className="font-medium text-gray-300">EIS (insurable cap)</span>
              <span>0.2% each (≤RM5k)</span>
              <span className="font-medium text-gray-300">PCB/MTD</span>
              <span>Progressive (see annual tax tab)</span>
            </div>
            <p className="text-[11px] text-gray-600 pt-1">
              Rates verified against KWSP, PERKESO, and LHDN schedules (2024). Always cross-check
              portals for updates.
            </p>
          </div>

          {/* Key portals */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-300">Key government portals</p>
            <ul className="space-y-1.5 text-sm">
              {[
                { label: "MyTax (LHDN income tax)", url: "https://mytax.hasil.gov.my" },
                {
                  label: "MySSTCustoms (SST registration & returns)",
                  url: "https://mysst.customs.gov.my",
                },
                { label: "i-Akaun KWSP (EPF)", url: "https://i-akaun.kwsp.gov.my" },
                { label: "ASSIST PERKESO (SOCSO/EIS)", url: "https://assist.perkeso.gov.my" },
                { label: "MyInvois (LHDN e-invoice)", url: "https://myinvois.hasil.gov.my" },
              ].map(({ label, url }) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#D4AF37] hover:underline"
                  >
                    <span className="text-xs">↗</span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
