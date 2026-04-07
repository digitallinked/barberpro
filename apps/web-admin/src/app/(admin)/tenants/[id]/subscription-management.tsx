"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  Gift,
  Loader2,
  RefreshCw,
  Repeat2,
  ShieldOff,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  cancelTenantSubscription,
  changeTenantPlan,
  extendTenantTrial,
  grantFreeAccess,
  revokeFreeAccess,
  syncTenantFromStripe,
} from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  tenantId: string;
  currentPlan: string | null;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  hasStripe: boolean;
};

type ActionResult = { success?: boolean; error?: string; status?: string } | void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    trialing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    past_due: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    canceled: "bg-red-500/15 text-red-400 border-red-500/30",
    unpaid: "bg-red-500/15 text-red-400 border-red-500/30",
    paused: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    incomplete: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    incomplete_expired: "bg-red-500/15 text-red-400 border-red-500/30",
    none: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  const label = status ?? "none";
  const cls = map[label] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function Toast({
  result,
  onDismiss,
}: {
  result: { ok: boolean; message: string };
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        result.ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {result.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{result.message}</span>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border bg-muted/10 px-5 py-4">{children}</div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubscriptionManagement({
  tenantId,
  currentPlan,
  subscriptionStatus,
  stripeSubscriptionId,
  hasStripe,
}: Props) {
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function showResult(result: ActionResult) {
    if (!result) return;
    if (result.error) {
      setToast({ ok: false, message: result.error });
    } else if (result.success) {
      setToast({ ok: true, message: result.status ? `Synced — status is now "${result.status}".` : "Done! The page will refresh with the latest data." });
    }
  }

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    startTransition(async () => {
      const result = await action(fd);
      showResult(result);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Subscription Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current:{" "}
            <StatusChip status={subscriptionStatus} />
            <span className="ml-2 capitalize font-medium">{currentPlan ?? "—"} plan</span>
          </p>
        </div>
        {pending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Working…
          </div>
        )}
      </div>

      {toast && (
        <Toast result={toast} onDismiss={() => setToast(null)} />
      )}

      {!hasStripe && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Stripe is not configured. Grant/Revoke free access still works; Stripe operations are disabled.
        </div>
      )}

      <div className="space-y-3">

        {/* ── Change plan ──────────────────────────────────────────────────── */}
        <ActionCard
          icon={TrendingUp}
          title="Change Plan"
          description="Switch between Starter and Professional, with or without Stripe."
          color="bg-blue-500/15 text-blue-400"
        >
          <ChangePlanForm
            tenantId={tenantId}
            currentPlan={currentPlan}
            hasStripe={hasStripe}
            onSubmit={(fd) => run(changeTenantPlan, fd)}
            pending={pending}
          />
        </ActionCard>

        {/* ── Extend trial ─────────────────────────────────────────────────── */}
        {hasStripe && stripeSubscriptionId && (
          <ActionCard
            icon={Timer}
            title="Extend Trial"
            description="Add days to the trial period in Stripe."
            color="bg-violet-500/15 text-violet-400"
          >
            <ExtendTrialForm
              tenantId={tenantId}
              onSubmit={(fd) => run(extendTenantTrial, fd)}
              pending={pending}
            />
          </ActionCard>
        )}

        {/* ── Cancel subscription ───────────────────────────────────────────── */}
        {hasStripe && stripeSubscriptionId && (
          <ActionCard
            icon={Ban}
            title="Cancel Subscription"
            description="Cancel via Stripe — at period end (graceful) or immediately."
            color="bg-orange-500/15 text-orange-400"
          >
            <CancelForm
              tenantId={tenantId}
              onSubmit={(fd) => run(cancelTenantSubscription, fd)}
              pending={pending}
            />
          </ActionCard>
        )}

        {/* ── Grant free access ─────────────────────────────────────────────── */}
        <ActionCard
          icon={Gift}
          title="Grant Free Access"
          description="Override subscription to active for N days — no Stripe required."
          color="bg-emerald-500/15 text-emerald-400"
        >
          <GrantAccessForm
            tenantId={tenantId}
            currentPlan={currentPlan}
            onSubmit={(fd) => run(grantFreeAccess, fd)}
            pending={pending}
          />
        </ActionCard>

        {/* ── Revoke free access ────────────────────────────────────────────── */}
        {subscriptionStatus === "active" && !stripeSubscriptionId && (
          <ActionCard
            icon={ShieldOff}
            title="Revoke Free Access"
            description="Set subscription_status back to canceled and remove trial date."
            color="bg-red-500/15 text-red-400"
          >
            <RevokeForm
              tenantId={tenantId}
              onSubmit={(fd) => run(revokeFreeAccess, fd)}
              pending={pending}
            />
          </ActionCard>
        )}

        {/* ── Sync from Stripe ──────────────────────────────────────────────── */}
        {hasStripe && stripeSubscriptionId && (
          <ActionCard
            icon={RefreshCw}
            title="Sync from Stripe"
            description="Pull the latest subscription state from Stripe and update the database."
            color="bg-gray-500/15 text-gray-400"
          >
            <SyncForm
              tenantId={tenantId}
              onSubmit={(fd) => run(syncTenantFromStripe, fd)}
              pending={pending}
            />
          </ActionCard>
        )}

      </div>
    </div>
  );
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function inputCls() {
  return "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
}

function selectCls() {
  return "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
}

function btnCls(variant: "primary" | "danger" | "ghost" = "primary") {
  const base = "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";
  if (variant === "danger") return `${base} bg-red-500/15 text-red-400 hover:bg-red-500/25`;
  if (variant === "ghost") return `${base} border border-border hover:bg-muted/50`;
  return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
}

function ChangePlanForm({
  tenantId,
  currentPlan,
  hasStripe,
  onSubmit,
  pending,
}: {
  tenantId: string;
  currentPlan: string | null;
  hasStripe: boolean;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">New plan</label>
        <select name="plan" defaultValue={currentPlan ?? "starter"} className={selectCls()}>
          <option value="starter">Starter — RM 99/mo</option>
          <option value="professional">Professional — RM 249/mo</option>
        </select>
      </div>
      {!hasStripe && (
        <p className="text-xs text-amber-400">⚠ No Stripe configured — will update DB only, not charge customer.</p>
      )}
      {hasStripe && (
        <p className="text-xs text-muted-foreground">Stripe subscription will be prorated and updated immediately.</p>
      )}
      <button type="submit" disabled={pending} className={btnCls()}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat2 className="h-3.5 w-3.5" />}
        Change Plan
      </button>
    </form>
  );
}

function ExtendTrialForm({
  tenantId,
  onSubmit,
  pending,
}: {
  tenantId: string;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Days to add</label>
        <input
          type="number"
          name="days"
          min={1}
          max={365}
          defaultValue={14}
          className={inputCls()}
        />
      </div>
      <p className="text-xs text-muted-foreground">Trial will be extended from today or from the current trial end, whichever is later.</p>
      <button type="submit" disabled={pending} className={btnCls()}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Timer className="h-3.5 w-3.5" />}
        Extend Trial
      </button>
    </form>
  );
}

function CancelForm({
  tenantId,
  onSubmit,
  pending,
}: {
  tenantId: string;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const [immediately, setImmediately] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="immediately" value={String(immediately)} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setImmediately(false)}
          className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
            !immediately ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
          }`}
        >
          <p className="font-semibold">At period end</p>
          <p className="text-xs text-muted-foreground mt-0.5">Customer keeps access until billing period ends</p>
        </button>
        <button
          type="button"
          onClick={() => setImmediately(true)}
          className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
            immediately ? "border-red-500 bg-red-500/10 text-red-400" : "border-border hover:bg-muted/50"
          }`}
        >
          <p className="font-semibold">Immediately</p>
          <p className="text-xs text-muted-foreground mt-0.5">Access revoked right away, no refund</p>
        </button>
      </div>
      {immediately && (
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-red-400">I understand this will immediately cut off the tenant's access.</span>
        </label>
      )}
      <button
        type="submit"
        disabled={pending || (immediately && !confirmed)}
        className={btnCls("danger")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
        {immediately ? "Cancel Immediately" : "Cancel at Period End"}
      </button>
    </form>
  );
}

function GrantAccessForm({
  tenantId,
  currentPlan,
  onSubmit,
  pending,
}: {
  tenantId: string;
  currentPlan: string | null;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan to grant</label>
          <select name="plan" defaultValue={currentPlan ?? "starter"} className={selectCls()}>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration (days)</label>
          <input type="number" name="days" min={1} max={3650} defaultValue={30} className={inputCls()} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Sets subscription_status to "active" and sets trial_ends_at to N days from now. No Stripe charge.
      </p>
      <button type="submit" disabled={pending} className={btnCls()}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
        Grant Free Access
      </button>
    </form>
  );
}

function RevokeForm({
  tenantId,
  onSubmit,
  pending,
}: {
  tenantId: string;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <p className="text-sm text-muted-foreground">
        This will set subscription_status to "canceled" and remove the trial end date. The tenant will be redirected to the subscription-required page on next login.
      </p>
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-red-400">I understand this will revoke the tenant's free access immediately.</span>
      </label>
      <button type="submit" disabled={pending || !confirmed} className={btnCls("danger")}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
        Revoke Free Access
      </button>
    </form>
  );
}

function SyncForm({
  tenantId,
  onSubmit,
  pending,
}: {
  tenantId: string;
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    onSubmit(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />
      <p className="text-sm text-muted-foreground">
        Fetches the subscription from Stripe and overwrites subscription_status, plan, stripe_price_id, and trial_ends_at in the database. Useful when the webhook was missed.
      </p>
      <button type="submit" disabled={pending} className={btnCls("ghost")}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Sync from Stripe
      </button>
    </form>
  );
}
