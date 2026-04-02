import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const SHOP_TIMEZONE = "Asia/Kuala_Lumpur";

export function shopDayUtcBounds(now: Date = new Date()): { start: string; end: string } {
  const ymd = formatInTimeZone(now, SHOP_TIMEZONE, "yyyy-MM-dd");
  const start = fromZonedTime(`${ymd} 00:00:00`, SHOP_TIMEZONE);
  const end = fromZonedTime(`${ymd} 23:59:59.999`, SHOP_TIMEZONE);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function shopCalendarDateString(now: Date = new Date()): string {
  return formatInTimeZone(now, SHOP_TIMEZONE, "yyyy-MM-dd");
}
