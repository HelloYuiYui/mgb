import { getSupabase } from "./supabase";
import { computeBlockedSlots, type AppointmentSlotRow } from "./slots";
import type { BookedSlot, ServiceType } from "./types";
import { dijkstra } from "@/app/api/calculate-distance/route";

/** Number of days ahead (after today) customers can book. */
export const BOOKING_WINDOW_DAYS = 14;

/** Today and today + BOOKING_WINDOW_DAYS as YYYY-MM-DD (UTC). */
export function bookingWindow(): { from: string; to: string } {
  const toDate = (ms: number) => new Date(ms).toISOString().split("T")[0];
  const now = Date.now();
  return {
    from: toDate(now),
    to: toDate(now + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000),
  };
}

interface GetBlockedSlotsOptions {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  userArea: string | null; // outward code of the customer's postcode; null skips travel buffers
}

/**
 * Fetches appointments in [from, to] and returns every blocked slot in that window:
 * booked slots plus travel buffers relative to `userArea`.
 * Throws if the database query fails.
 */
export async function getBlockedSlots({
  from,
  to,
  userArea,
}: GetBlockedSlotsOptions): Promise<BookedSlot[]> {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("appointment_date,appointment_time,postcode,service")
    .gte("appointment_date", from)
    .lte("appointment_date", to);

  if (error) {
    throw new Error(`Failed to fetch appointments: ${error.message}`);
  }

  const rows: AppointmentSlotRow[] = (data ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5), // Postgres returns HH:MM:SS
    postcode: row.postcode,
    service: (row.service ?? "haircut") as ServiceType,
  }));

  return computeBlockedSlots(rows, userArea, (a, b) => dijkstra(a, b)?.weight ?? null);
}
