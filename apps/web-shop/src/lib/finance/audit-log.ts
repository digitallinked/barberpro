/**
 * Finance Audit Log — records sensitive finance actions for review.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export type AuditActionType =
  | "transaction_void"
  | "transaction_refund"
  | "stock_adjustment"
  | "payroll_approve"
  | "payroll_pay"
  | "period_close"
  | "period_reopen"
  | "journal_manual"
  | "journal_reversal"
  | "expense_void"
  | "tax_override";

export async function logFinanceAction(
  client: Client,
  params: {
    tenantId: string;
    actionType: AuditActionType;
    entityType: string;
    entityId: string | null;
    actorId: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table added by migration, types will regenerate
  const { error } = await (client as any).from("finance_audit_log").insert({
    tenant_id: params.tenantId,
    action_type: params.actionType,
    entity_type: params.entityType,
    entity_id: params.entityId,
    actor_id: params.actorId,
    details: params.details ?? null,
  });

  if (error) {
    logger.error("[finance-audit] Failed to write audit log", error, {
      action: params.actionType,
    });
  }
}
