import { ALL_TIMES } from "./slots";

/** The business's timezone: "today" and "now" are always computed here, never in UTC. */
export const TIME_ZONE = "Europe/London";

/** Number of days ahead (after today) customers can book. */
export const BOOKING_WINDOW_DAYS = 14;

/** The current date (YYYY-MM-DD) and time (HH:MM) in Europe/London. */
export interface LondonNow {
  date: string;
  time: string;
}

const londonFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The current date and time in Europe/London (or at `at`, for tests). */
export function londonNow(at: Date = new Date()): LondonNow {
  const parts = Object.fromEntries(
    londonFormat.formatToParts(at).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** Adds `days` to a YYYY-MM-DD date string (calendar days, no timezone involved). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today and today + BOOKING_WINDOW_DAYS (inclusive) as YYYY-MM-DD, in Europe/London. */
export function bookingWindow(now: LondonNow = londonNow()): { from: string; to: string } {
  return { from: now.date, to: addDays(now.date, BOOKING_WINDOW_DAYS) };
}

/** Whether a slot has already started: any earlier day, or today at or before the current time. */
export function isPastSlot(date: string, time: string, now: LondonNow = londonNow()): boolean {
  return date < now.date || (date === now.date && time <= now.time);
}

/**
 * Checks a requested booking date and start time against the slot grid, the booking
 * window and the current time. Returns an error message, or null if the request is valid.
 */
export function bookingDateTimeError(
  date: string,
  time: string,
  now: LondonNow = londonNow(),
): string | null {
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    addDays(date, 0) === date; // rejects e.g. 2026-02-30, which Date silently rolls over
  if (!validDate || !ALL_TIMES.includes(time)) {
    return "Invalid date or time.";
  }

  const { from, to } = bookingWindow(now);
  if (date > to) {
    return `Bookings can only be made up to ${BOOKING_WINDOW_DAYS} days ahead.`;
  }
  if (date < from || isPastSlot(date, time, now)) {
    return "This time has already passed. Please pick another time.";
  }
  return null;
}
