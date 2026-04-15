/**
 * Journal Posting Engine — creates balanced double-entry journal entries
 * from source documents (POS sales, expenses, payroll, etc.).
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { roundMYR, type SourceDocumentType } from "./constants";

type Client = SupabaseClient<Database>;

export type JournalLineInput = {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
};

export type PostJournalInput = {
  tenantId: string;
  entryDate: string;
  description: string;
  sourceType: SourceDocumentType;
  sourceId: string | null;
  postedBy: string;
  lines: JournalLineInput[];
};

export type PostJournalResult = {
  success: boolean;
  journalEntryId?: string;
  error?: string;
};

async function resolveAccountId(
  client: Client,
  tenantId: string,
  code: string
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table added by migration, types will regenerate
  const { data } = await (client as any)
    .from("chart_of_accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("code", code)
    .eq("is_active", true)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Post a balanced journal entry. Validates balance before inserting.
 * The database trigger provides a second safety net.
 */
export async function postJournalEntry(
  client: Client,
  input: PostJournalInput
): Promise<PostJournalResult> {
  const { tenantId, entryDate, description, sourceType, sourceId, postedBy, lines } = input;

  if (lines.length === 0) {
    return { success: false, error: "Journal entry must have at least one line" };
  }

  const totalDebits = roundMYR(lines.reduce((s, l) => s + l.debitAmount, 0));
  const totalCredits = roundMYR(lines.reduce((s, l) => s + l.creditAmount, 0));
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return {
      success: false,
      error: `Entry not balanced: debits=${totalDebits}, credits=${totalCredits}`,
    };
  }

  // Resolve account codes to IDs
  const resolvedLines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string | null;
  }> = [];

  for (const line of lines) {
    const accountId = await resolveAccountId(client, tenantId, line.accountCode);
    if (!accountId) {
      return { success: false, error: `Account code "${line.accountCode}" not found` };
    }
    resolvedLines.push({
      accountId,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      description: line.description ?? null,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table added by migration, types will regenerate
  const db = client as any;
  const { data: entry, error: entryError } = await db
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      entry_date: entryDate,
      description,
      source_type: sourceType,
      source_id: sourceId,
      posted_by: postedBy,
    })
    .select("id")
    .single();

  if (entryError || !entry) {
    return { success: false, error: entryError?.message ?? "Failed to create journal entry" };
  }

  const lineRows = resolvedLines.map((rl) => ({
    tenant_id: tenantId,
    journal_entry_id: (entry as { id: string }).id,
    account_id: rl.accountId,
    debit_amount: rl.debitAmount,
    credit_amount: rl.creditAmount,
    description: rl.description,
  }));

  const { error: linesError } = await db.from("journal_lines").insert(lineRows);

  if (linesError) {
    return { success: false, error: linesError.message };
  }

  return { success: true, journalEntryId: (entry as { id: string }).id };
}

// ─── Pre-built posting templates ────────────────────────────────────────────

/**
 * Build journal lines for a POS sale transaction.
 * Debits the appropriate payment account, credits revenue and SST payable.
 */
export function buildSaleJournalLines(
  paymentMethod: string,
  subtotal: number,
  taxAmount: number,
  discountAmount: number,
  serviceRevenue: number,
  productRevenue: number,
  cogsAmount: number
): JournalLineInput[] {
  const lines: JournalLineInput[] = [];
  const totalAmount = roundMYR(subtotal - discountAmount + taxAmount);

  // Debit: payment account
  const paymentAccountCode = paymentMethodToAccountCode(paymentMethod);
  if (totalAmount > 0) {
    lines.push({
      accountCode: paymentAccountCode,
      debitAmount: totalAmount,
      creditAmount: 0,
      description: "Payment received",
    });
  }

  // Credit: service revenue
  if (serviceRevenue > 0) {
    lines.push({
      accountCode: "4000",
      debitAmount: 0,
      creditAmount: roundMYR(serviceRevenue),
      description: "Service revenue",
    });
  }

  // Credit: product revenue
  if (productRevenue > 0) {
    lines.push({
      accountCode: "4010",
      debitAmount: 0,
      creditAmount: roundMYR(productRevenue),
      description: "Product revenue",
    });
  }

  // Debit: discounts given (contra-revenue)
  if (discountAmount > 0) {
    lines.push({
      accountCode: "4900",
      debitAmount: roundMYR(discountAmount),
      creditAmount: 0,
      description: "Discount given",
    });
  }

  // Credit: SST payable
  if (taxAmount > 0) {
    lines.push({
      accountCode: "2000",
      debitAmount: 0,
      creditAmount: roundMYR(taxAmount),
      description: "SST collected",
    });
  }

  // COGS: debit COGS, credit inventory
  if (cogsAmount > 0) {
    lines.push({
      accountCode: "5000",
      debitAmount: roundMYR(cogsAmount),
      creditAmount: 0,
      description: "Cost of goods sold",
    });
    lines.push({
      accountCode: "1100",
      debitAmount: 0,
      creditAmount: roundMYR(cogsAmount),
      description: "Inventory reduction",
    });
  }

  return lines;
}

function paymentMethodToAccountCode(method: string): string {
  switch (method) {
    case "cash":
      return "1000";
    case "card":
      return "1030";
    case "bank_transfer":
      return "1010";
    case "e_wallet":
    case "duitnow_qr":
      return "1020";
    default:
      return "1000";
  }
}
