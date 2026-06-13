import type { BookedSlot, ServiceType } from "./types";

/** All available time slots in a day (10:00–19:00 at 30-min intervals). */
export const ALL_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

/** Display labels for each service type. */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  haircut: "Haircut",
  haircut_shave: "Haircut + Shave",
};

/** Travel time (minutes) above which adjacent slots are blocked for travel. */
const TRAVEL_BUFFER_THRESHOLD = 15;

/** An appointment row as needed for slot-blocking computation. */
export interface AppointmentSlotRow {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  postcode: string; // full postcode, e.g. "G51 2AA"
  service: ServiceType;
}

/** Extracts the outward area code from a full postcode (e.g. "G51 2AA" → "G51"). */
export function toArea(postcode: string): string {
  return postcode.replace(/\s/g, "").slice(0, -3).toUpperCase();
}

/**
 * Slot times an appointment occupies — haircut+shave spans two consecutive slots.
 * A haircut+shave starting at the last slot (19:00) overruns the day, so only
 * the start slot is occupied.
 */
export function occupiedTimes(time: string, service: ServiceType): string[] {
  const next = ALL_TIMES[ALL_TIMES.indexOf(time) + 1];
  return service === "haircut_shave" && next ? [time, next] : [time];
}

/**
 * Computes all blocked slots for a set of appointments:
 * - Slots actually occupied by appointments (kind "booked").
 * - Travel buffers around appointments >15 min from the user's area (kind "buffer").
 *   Haircut appointments get a buffer before and after; haircut+shave only before —
 *   its second slot absorbs the travel time, so no buffer follows it.
 *
 * `getTravelTime` returns minutes between two areas, or null if unreachable.
 * Buffers are skipped when `userArea` is null (no postcode context).
 */
export function computeBlockedSlots(
  rows: AppointmentSlotRow[],
  userArea: string | null,
  getTravelTime: (from: string, to: string) => number | null,
): BookedSlot[] {
  const blocked: BookedSlot[] = [];
  const keys = new Set<string>();

  // Pass 1: slots occupied by appointments (take precedence over buffers)
  for (const row of rows) {
    for (const time of occupiedTimes(row.time, row.service)) {
      const key = `${row.date}|${time}`;
      if (keys.has(key)) continue;
      keys.add(key);
      blocked.push({ date: row.date, time, area: row.postcode, kind: "booked" });
    }
  }

  // Pass 2: travel buffers around far-away appointments
  if (userArea) {
    for (const row of rows) {
      const minutes = getTravelTime(userArea, toArea(row.postcode));
      if (minutes === null || minutes <= TRAVEL_BUFFER_THRESHOLD) continue;

      const idx = ALL_TIMES.indexOf(row.time);
      const candidates = [ALL_TIMES[idx - 1]];
      if (row.service !== "haircut_shave") candidates.push(ALL_TIMES[idx + 1]);

      for (const time of candidates) {
        if (!time) continue;
        const key = `${row.date}|${time}`;
        if (keys.has(key)) continue;
        keys.add(key);
        blocked.push({ date: row.date, time, area: "", kind: "buffer" });
      }
    }
  }

  return blocked;
}

/**
 * Whether a booking for `service` can start at `time` on `date` given the blocked slots.
 * A haircut+shave also needs the following slot to not be occupied by an appointment —
 * a buffer-only block on it is fine, since shave bookings carry no buffer after
 * themselves. Starting at the last slot (19:00) is allowed: the booking simply
 * overruns the end of the day.
 */
export function isStartTimeAvailable(
  blockedSlots: BookedSlot[],
  date: string,
  time: string,
  service: ServiceType,
): boolean {
  if (!ALL_TIMES.includes(time)) return false;

  const dayBlocked = new Map(
    blockedSlots.filter((s) => s.date === date).map((s) => [s.time, s.kind]),
  );
  if (dayBlocked.has(time)) return false;

  if (service === "haircut_shave") {
    const next = ALL_TIMES[ALL_TIMES.indexOf(time) + 1];
    if (next && dayBlocked.get(next) === "booked") return false;
  }

  return true;
}
