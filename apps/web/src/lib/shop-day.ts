import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Calendar day for queue stats and filtering (Malaysia). */
export const SHOP_TIMEZONE = "Asia/Kuala_Lumpur";

/** Inclusive UTC bounds for the shop calendar day containing `now`. */
export function shopDayUtcBounds(now: Date = new Date()): { start: string; end: string } {
  const ymd = formatInTimeZone(now, SHOP_TIMEZONE, "yyyy-MM-dd");
  const start = fromZonedTime(`${ymd} 00:00:00`, SHOP_TIMEZONE);
  const end = fromZonedTime(`${ymd} 23:59:59.999`, SHOP_TIMEZONE);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatShopDateLabel(now: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: SHOP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(now);
}

export function formatShopTimeLabel(now: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: SHOP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);
}
