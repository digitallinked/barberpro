import { AlertTriangle, Info, Settings, ToggleLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireAccess } from "@/lib/require-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePlatformSetting } from "./actions";

type SettingRow = {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
};

const SETTING_LABELS: Record<string, string> = {
  platform_name: "Platform Name",
  support_email: "Support Email",
  maintenance_mode: "Maintenance Mode",
  new_registrations_enabled: "New Registrations",
  trial_days: "Trial Days",
};

const BOOLEAN_KEYS = new Set(["maintenance_mode", "new_registrations_enabled"]);

export default async function SettingsPage() {
  const role = await requireAccess("/settings");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value, description, updated_by, updated_at")
    .order("key");

  const settings = (data ?? []) as SettingRow[];
  const isSuperAdmin = role === "super_admin";

  const generalSettings = settings.filter((s) => !BOOLEAN_KEYS.has(s.key) && s.key !== "maintenance_mode");
  const featureSettings = settings.filter((s) => BOOLEAN_KEYS.has(s.key));
  const maintenanceSetting = settings.find((s) => s.key === "maintenance_mode");
  const isMaintenanceMode = maintenanceSetting?.value === "true";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Settings"
        description="Manage global platform configuration and feature flags"
      />

      {error && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Settings table not found. Run the latest migration (20260402140000) to create it.
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">General</h2>
        </div>
        <div className="divide-y divide-border">
          {generalSettings.map((setting) => (
            <form key={setting.key} action={updatePlatformSetting as (formData: FormData) => void} className="flex items-center gap-4 px-5 py-4">
              <input type="hidden" name="key" value={setting.key} />
              <div className="flex-1">
                <label className="block text-sm font-medium">
                  {SETTING_LABELS[setting.key] ?? setting.key}
                </label>
                {setting.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{setting.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  name="value"
                  defaultValue={setting.value}
                  disabled={!isSuperAdmin}
                  className="h-9 w-56 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
                {isSuperAdmin && (
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                )}
              </div>
            </form>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Feature Flags</h2>
        </div>
        <div className="divide-y divide-border">
          {featureSettings.map((setting) => {
            const isEnabled = setting.value === "true";
            return (
              <div key={setting.key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{SETTING_LABELS[setting.key] ?? setting.key}</p>
                  {setting.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{setting.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                  </p>
                </div>
                {isSuperAdmin ? (
                  <form action={updatePlatformSetting as (formData: FormData) => void}>
                    <input type="hidden" name="key" value={setting.key} />
                    <input type="hidden" name="value" value={isEnabled ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`flex h-8 w-14 items-center rounded-full border transition-colors ${
                        isEnabled
                          ? "border-primary/50 bg-primary/20 justify-end"
                          : "border-border bg-muted justify-start"
                      }`}
                    >
                      <span className={`m-1 h-5 w-5 rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted-foreground/50"}`} />
                    </button>
                  </form>
                ) : (
                  <div
                    className={`flex h-8 w-14 items-center rounded-full border ${
                      isEnabled ? "border-primary/50 bg-primary/20 justify-end" : "border-border bg-muted justify-start"
                    }`}
                  >
                    <span className={`m-1 h-5 w-5 rounded-full ${isEnabled ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-500/30 bg-card">
        <div className="flex items-center gap-2 border-b border-red-500/20 px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When enabled, non-admin users see a maintenance page. Use when deploying major changes.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isMaintenanceMode ? "bg-red-400" : "bg-green-400"}`} />
                <span className="text-xs text-muted-foreground">
                  Currently: <strong>{isMaintenanceMode ? "Enabled" : "Disabled"}</strong>
                </span>
              </div>
            </div>
            {isSuperAdmin && maintenanceSetting && (
              <form action={updatePlatformSetting as (formData: FormData) => void}>
                <input type="hidden" name="key" value="maintenance_mode" />
                <input type="hidden" name="value" value={isMaintenanceMode ? "false" : "true"} />
                <button
                  type="submit"
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isMaintenanceMode
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {isMaintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
