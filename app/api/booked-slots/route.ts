import { NextRequest, NextResponse } from "next/server";
import { getBlockedSlots } from "@/lib/availability";
import { bookingWindow } from "@/lib/time";
import { toArea } from "@/lib/slots";

/**
 * GET /api/booked-slots?postcode=G51+2AA
 * Returns slots occupied by appointments within the booking window (haircut+shave
 * bookings span two slots), plus adjacent slots blocked by travel-time constraints.
 */
export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");
  const userArea = postcode ? toArea(postcode) : null;

  try {
    const bookedSlots = await getBlockedSlots({ ...bookingWindow(), userArea });
    return NextResponse.json({ bookedSlots });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { bookedSlots: [], error: "Failed to fetch appointments." },
      { status: 500 },
    );
  }
}
