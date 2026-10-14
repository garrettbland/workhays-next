import { SITE } from "@/lib/site";

const short = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: SITE.timezone });
const long = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: SITE.timezone });
const eventFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: SITE.timezone,
});
const eventDay = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: SITE.timezone });

/** "Oct 5" — dates are shown absolutely so pages can be cached without a clock. */
export const formatShortDate = (iso: string | null) => (iso ? short.format(new Date(iso)) : "");
export const formatLongDate = (iso: string | null) => (iso ? long.format(new Date(iso)) : "");
export const formatEventTime = (iso: string, allDay: boolean) => (allDay ? eventDay : eventFmt).format(new Date(iso));

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  seasonal: "Seasonal",
  internship: "Internship",
};

/** schema.org employmentType values for Google for Jobs */
export const JOB_TYPE_SCHEMA: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  temporary: "TEMPORARY",
  seasonal: "TEMPORARY",
  internship: "INTERN",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const PERIOD: Record<string, string> = { hour: "/hr", week: "/wk", month: "/mo", year: "/yr" };

export function formatPay(min: number | null, max: number | null, period: string | null): string | null {
  if (min == null && max == null) return null;
  const p = period ? PERIOD[period] ?? "" : "";
  if (min != null && max != null && min !== max) return `${money.format(min)}–${money.format(max)}${p}`;
  return `${money.format((min ?? max)!)}${p}`;
}

/** True when a date is within `days` from now. Only call from request-time code. */
export function isWithinDays(iso: string | null, days: number): boolean {
  return !!iso && Date.parse(iso) < Date.now() + days * 86400_000;
}

const timeOnly = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: SITE.timezone });
const fullDay = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: SITE.timezone });

/** "Thursday, November 5, 2026" and "4:00 PM – 7:00 PM" (or "All day"). */
export function formatEventWhen(startsAt: string, endsAt: string | null, allDay: boolean): { date: string; time: string } {
  const date = fullDay.format(new Date(startsAt));
  if (allDay) return { date, time: "All day" };
  const start = timeOnly.format(new Date(startsAt));
  return { date, time: endsAt ? `${start} – ${timeOnly.format(new Date(endsAt))}` : start };
}

/** True once a date has passed. Only call from request-time code. */
export function isPast(iso: string): boolean {
  return Date.parse(iso) < Date.now();
}
