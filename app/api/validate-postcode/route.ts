import { NextRequest, NextResponse } from "next/server";
import type { ValidatePostcodeResponse, BookedSlot } from "@/lib/types";
import { postcodes } from "../calculate-distance/route";
import { getBlockedSlots } from "@/lib/availability";
import { bookingWindow } from "@/lib/time";

/**
 * POST /api/validate-postcode
 * Validates a Glasgow-area postcode (starts with "G", 6 characters)
 * and returns blocked slots (booked + travel buffers) for the booking window.
 */
export async function POST(request: NextRequest) {
  const { postcode } = await request.json();

  // Server-side postcode validation (strip spaces, 5-6 alphanumeric chars starting with G)
  const cleaned = (postcode ?? "").toString().replace(/\s/g, "").toUpperCase();
  if (!/^G[A-Z0-9]{1,2}[A-Z0-9]{3}$/.test(cleaned) && !postcodes.has(cleaned.slice(0, -3))) {
    return NextResponse.json<ValidatePostcodeResponse>({
      valid: false,
      error: postcodes.has(cleaned.slice(0, -3)) ? "Invalid postcode. Must be a Glasgow-area postcode (e.g. G1 1AA)." : "Unfortunately your postcode is outside our service area.",
      bookedSlots: [],
    });
  }

  // Blocked slots (booked + travel buffers) for the booking window
  let bookedSlots: BookedSlot[];
  try {
    bookedSlots = await getBlockedSlots({ ...bookingWindow(), userArea: cleaned.slice(0, -3) });
  } catch (err) {
    console.error(err);
    return NextResponse.json<ValidatePostcodeResponse>(
      { valid: false, error: "Failed to fetch appointments.", bookedSlots: [] },
      { status: 500 }
    );
  }

  return NextResponse.json<ValidatePostcodeResponse>({
    valid: true,
    bookedSlots,
  });
}
