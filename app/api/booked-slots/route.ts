import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { BookedSlot } from "@/lib/types";

/**
 * GET /api/booked-slots
 * Returns booked appointment slots for the next 14 days.
 */
export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await getSupabase()
    .from("appointments")
    .select("appointment_date,appointment_time");
    // .gte("appointment_date", today)
    // .lte("appointment_date", twoWeeks);

  if (error) {
    return NextResponse.json(
      { bookedSlots: [], error: "Failed to fetch appointments." },
      { status: 500 },
    );
  }

  const bookedSlots: BookedSlot[] = (data ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
  }));
  const ret = NextResponse.json({ bookedSlots }); 
  console.log("Fetched booked slots:", bookedSlots);
  return ret;
}
