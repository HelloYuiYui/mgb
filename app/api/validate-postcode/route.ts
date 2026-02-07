import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ValidatePostcodeResponse, BookedSlot } from "@/lib/types";

/**
 * POST /api/validate-postcode
 * Validates a Glasgow-area postcode (starts with "G", 6 characters)
 * and returns booked appointment slots for the next 14 days.
 */
export async function POST(request: NextRequest) {
  const { postcode } = await request.json();

  // Server-side postcode validation
  const trimmed = (postcode ?? "").toString().trim().toUpperCase();
  if (trimmed.length !== 6 || !trimmed.startsWith("G")) {
    return NextResponse.json<ValidatePostcodeResponse>({
      valid: false,
      error: "Invalid postcode. Must be a Glasgow-area postcode (e.g. G1 1AA).",
      bookedSlots: [],
    });
  }

  // Fetch booked appointments for the next 14 days
  const today = new Date().toISOString().split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await getSupabase()
    .from("appointments")
    .select("appointment_date, appointment_time")
    .gte("appointment_date", today)
    .lte("appointment_date", twoWeeks);

  if (error) {
    return NextResponse.json<ValidatePostcodeResponse>(
      { valid: false, error: "Failed to fetch appointments.", bookedSlots: [] },
      { status: 500 }
    );
  }

  const bookedSlots: BookedSlot[] = (data ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5), // Ensure HH:MM format
  }));

  return NextResponse.json<ValidatePostcodeResponse>({
    valid: true,
    bookedSlots,
  });
}
