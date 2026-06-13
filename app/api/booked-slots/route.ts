import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { dijkstra } from "../calculate-distance/route";
import { computeBlockedSlots, toArea, type AppointmentSlotRow } from "@/lib/slots";
import type { ServiceType } from "@/lib/types";

/**
 * GET /api/booked-slots?postcode=G51+2AA
 * Returns slots occupied by appointments (haircut+shave bookings span two slots),
 * plus adjacent slots blocked by travel-time constraints.
 */
export async function GET(request: NextRequest) {
  const { data, error } = await getSupabase()
    .from("appointments")
    .select("appointment_date,appointment_time,postcode,service");

  if (error) {
    return NextResponse.json(
      { bookedSlots: [], error: "Failed to fetch appointments." },
      { status: 500 },
    );
  }

  const rows: AppointmentSlotRow[] = (data ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
    postcode: row.postcode,
    service: (row.service ?? "haircut") as ServiceType,
  }));

  const postcode = request.nextUrl.searchParams.get("postcode");
  const userArea = postcode ? toArea(postcode) : null;

  const bookedSlots = computeBlockedSlots(
    rows,
    userArea,
    (from, to) => dijkstra(from, to)?.weight ?? null,
  );

  return NextResponse.json({ bookedSlots });
}
