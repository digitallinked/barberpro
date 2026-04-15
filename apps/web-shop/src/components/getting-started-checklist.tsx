"use client";

import { Check, Scissors, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useBranchHref } from "@/hooks";
import { useT } from "@/lib/i18n/language-context";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/components/tenant-provider";

type ChecklistData = {
  hasService: boolean;
  hasOperatingHours: boolean;
  hasStaff: boolean;
  hasLogo: boolean;
  hasBilling: boolean;
};

export function GettingStartedChecklist() {
  const t = useT();
  const supabase = useSupabase();
  const { tenantId, userRole, stripeSubscriptionId } = useTenant();
  const bHref = useBranchHref();

  const [data, setData] = useState<ChecklistData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (userRole !== "owner") return;

    async function fetchChecklist() {
      const [servicesRes, usersRes, branchRes, tenantRes] = await Promise.all([
        supabase
          .from("services")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .limit(1),
        supabase
          .from("app_users")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("is_active", true),
        supabase
          .from("branches")
          .select("operating_hours")
          .eq("tenant_id", tenantId)
          .eq("is_hq", true)
          .maybeSingle(),
        supabase
          .from("tenants")
          .select("logo_url, stripe_subscription_id")
          .eq("id", tenantId)
          .maybeSingle(),
      ]);

      const branchAny = branchRes.data as Record<string, unknown> | null;
      const tenantAny = tenantRes.data as Record<string, unknown> | null;
      const operatingHours = branchAny?.operating_hours as Record<string, unknown> | null;
      const hasHours = operatingHours
        ? Object.values(operatingHours).some((v) => v !== null)
        : false;

      setData({
        hasService: (servicesRes.data?.length ?? 0) > 0,
        hasOperatingHours: hasHours,
        hasStaff: (usersRes.data?.length ?? 0) > 1,
        hasLogo: Boolean(tenantAny?.logo_url),
        hasBilling: Boolean(tenantAny?.stripe_subscription_id ?? stripeSubscriptionId),
      });
    }

    fetchChecklist();
  }, [supabase, tenantId, userRole, stripeSubscriptionId]);

  if (userRole !== "owner") return null;
  if (dismissed) return null;
  if (!data) return null;

  const tc = t.setupChecklist;

  const items = [
    {
      key: "account",
      label: tc.taskAccount,
      done: true,
      href: null as string | null,
      cta: null as string | null,
    },
    {
      key: "shop",
      label: tc.taskShop,
      done: true,
      href: null as string | null,
      cta: null as string | null,
    },
    {
      key: "service",
      label: tc.taskService,
      done: data.hasService,
      href: bHref("/services"),
      cta: tc.addService,
    },
    {
      key: "hours",
      label: tc.taskHours,
      done: data.hasOperatingHours,
      href: bHref("/settings"),
      cta: tc.setHours,
    },
    {
      key: "staff",
      label: tc.taskStaff,
      done: data.hasStaff,
      href: bHref("/staff"),
      cta: tc.addStaff,
    },
    {
      key: "logo",
      label: tc.taskLogo,
      done: data.hasLogo,
      href: "/workspace/profile",
      cta: tc.addLogo,
    },
    {
      key: "billing",
      label: tc.taskBilling,
      done: data.hasBilling,
      href: "/billing",
      cta: tc.subscribe,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const pct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  // Hide the card once everything is actually complete
  if (allDone) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-white">
            <Scissors className="h-4 w-4 text-primary" />
            {tc.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{tc.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-white/5 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}{" "}
            {completedCount === totalCount
              ? "✓"
              : ""}
          </span>
          <span className="text-xs font-semibold text-primary">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {items.map(({ key, label, done, href, cta }) => (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              done ? "opacity-50" : "bg-white/[0.03] hover:bg-white/[0.05]"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                done
                  ? "border-primary/50 bg-primary/20"
                  : "border-border/60 bg-muted"
              }`}
            >
              {done && <Check className="h-3 w-3 text-primary" />}
            </div>

            {/* Label */}
            <span
              className={`flex-1 text-sm leading-snug ${
                done ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {label}
            </span>

            {/* CTA */}
            {!done && href && cta && (
              <Link
                href={href}
                className="shrink-0 text-xs font-medium text-primary transition hover:text-primary/70"
              >
                {cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
