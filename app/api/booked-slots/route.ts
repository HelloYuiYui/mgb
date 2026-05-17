import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { dijkstra } from "../calculate-distance/route";
import type { BookedSlot } from "@/lib/types";

const ALL_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

/**
 * GET /api/booked-slots?postcode=G51+2AA
 * Returns booked slots, plus adjacent slots blocked by travel-time constraints.
 */
export async function GET(request: NextRequest) {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("appointment_date,appointment_time,postcode");

  if (error) {
    return NextResponse.json(
      { bookedSlots: [], error: "Failed to fetch appointments." },
      { status: 500 },
    );
  }

  const bookedSlots: BookedSlot[] = (data ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
    area: row.postcode,
  }));

  const postcode = request.nextUrl.searchParams.get("postcode");
  if (postcode) {
    const userArea = postcode.replace(/\s/g, "").slice(0, -3).toUpperCase();
    const bookedKeys = new Set(bookedSlots.map((s) => `${s.date}|${s.time}`));

    for (const slot of [...bookedSlots]) {
      if (!slot.area) continue;
      const slotArea = slot.area.replace(/\s/g, "").slice(0, -3).toUpperCase();
      const result = dijkstra(userArea, slotArea);
      if (!result || result.weight <= 15) continue;

      const idx = ALL_TIMES.indexOf(slot.time);
      const candidates = [ALL_TIMES[idx - 1], ALL_TIMES[idx + 1]];
      for (const time of candidates) {
        if (!time) continue;
        const key = `${slot.date}|${time}`;
        if (!bookedKeys.has(key)) {
          bookedKeys.add(key);
          bookedSlots.push({ date: slot.date, time, area: "" });
        }
      }
    }
  }

  return NextResponse.json({ bookedSlots });
}
