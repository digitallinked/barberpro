/** Maps UI / legacy values to DB `transactions.payment_method` (check constraint). */
const ALIASES: Record<string, string> = {
  qr: "duitnow_qr",
  ewallet: "e_wallet",
};

/** Allowed values on `public.transactions.payment_method`. */
export const TRANSACTION_PAYMENT_METHODS = new Set([
  "cash",
  "card",
  "bank_transfer",
  "e_wallet",
  "duitnow_qr",
  "split",
]);

export function paymentMethodForDb(raw: string): string {
  const k = raw.toLowerCase().trim();
  return ALIASES[k] ?? k;
}
