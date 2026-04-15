/**
 * Reconciliation service — runs anomaly checks and returns a health report.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type AnomalyItem = {
  check: string;
  severity: "error" | "warning" | "info";
  count: number;
  details?: unknown[];
};

export type ReconciliationReport = {
  timestamp: string;
  tenantId: string;
  checks: AnomalyItem[];
  isClean: boolean;
};

export async function runReconciliationChecks(
  client: Client,
  tenantId: string
): Promise<ReconciliationReport> {
  const checks: AnomalyItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPCs added by migration, types will regenerate
  const rpc = (client as any).rpc.bind(client);
  const results = await Promise.allSettled([
    rpc("check_transaction_integrity", { p_tenant_id: tenantId }),
    rpc("check_duplicate_queue_payments", { p_tenant_id: tenantId }),
    rpc("check_negative_stock", { p_tenant_id: tenantId }),
    rpc("check_orphan_transactions", { p_tenant_id: tenantId }),
    rpc("check_inventory_stock_reconciliation", { p_tenant_id: tenantId }),
    rpc("check_payroll_period_integrity", { p_tenant_id: tenantId }),
    rpc("check_negative_margin_sales", { p_tenant_id: tenantId }),
  ]);

  const checkNames = [
    { name: "Transaction header vs line sum mismatch", severity: "error" as const },
    { name: "Duplicate queue-to-transaction links", severity: "error" as const },
    { name: "Negative stock quantities", severity: "warning" as const },
    { name: "Orphan transactions without items", severity: "warning" as const },
    { name: "Inventory stock vs movement discrepancy", severity: "warning" as const },
    { name: "Payroll entries outside period bounds", severity: "info" as const },
    { name: "Negative margin sales", severity: "info" as const },
  ];

  results.forEach((result, idx) => {
    const check = checkNames[idx];
    if (result.status === "fulfilled") {
      const data = result.value.data;
      const items = Array.isArray(data) ? data : [];
      checks.push({
        check: check.name,
        severity: items.length > 0 ? check.severity : "info",
        count: items.length,
        details: items.length > 0 ? items.slice(0, 20) : undefined,
      });
    } else {
      checks.push({
        check: check.name,
        severity: "warning",
        count: -1,
        details: [{ error: "Check failed to execute" }],
      });
    }
  });

  const hasErrors = checks.some((c) => c.severity === "error" && c.count > 0);
  const hasWarnings = checks.some((c) => c.severity === "warning" && c.count > 0);

  return {
    timestamp: new Date().toISOString(),
    tenantId,
    checks,
    isClean: !hasErrors && !hasWarnings,
  };
}
