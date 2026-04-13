const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

export type Period = "today" | "week" | "month";

export function getMalaysiaDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const myNow = new Date(now.getTime() + MY_OFFSET_MS);
  const myStartOfDay = new Date(
    Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), myNow.getUTCDate())
  );
  const startOfTodayUTC = new Date(myStartOfDay.getTime() - MY_OFFSET_MS);
  const endOfTodayUTC = new Date(startOfTodayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (period === "today") {
    return { start: startOfTodayUTC, end: endOfTodayUTC };
  }

  if (period === "week") {
    const dayOfWeek = myStartOfDay.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeekUTC = new Date(
      startOfTodayUTC.getTime() - daysFromMonday * 24 * 60 * 60 * 1000
    );
    return { start: startOfWeekUTC, end: endOfTodayUTC };
  }

  const myStartOfMonth = new Date(
    Date.UTC(myNow.getUTCFullYear(), myNow.getUTCMonth(), 1)
  );
  const startOfMonthUTC = new Date(myStartOfMonth.getTime() - MY_OFFSET_MS);
  return { start: startOfMonthUTC, end: endOfTodayUTC };
}

/** Returns today's date string in Malaysia time as YYYY-MM-DD for queue_day matching */
export function malaysiaDateString(): string {
  const now = new Date();
  const myNow = new Date(now.getTime() + MY_OFFSET_MS);
  const y = myNow.getUTCFullYear();
  const m = String(myNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(myNow.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMYR(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

export function formatMYRCompact(amount: number): string {
  if (amount >= 1000) {
    return `RM ${(amount / 1000).toFixed(1)}k`;
  }
  return `RM ${amount.toFixed(2)}`;
}
