import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type {
  BookAppointmentPayload,
  BookAppointmentResponse,
  BookedSlot,
  ServiceType,
} from "@/lib/types";
import { postcodes } from "../calculate-distance/route";
import { getBlockedSlots } from "@/lib/availability";
import { isStartTimeAvailable } from "@/lib/slots";
import { sendBookingEmails } from "@/lib/email";

/**
 * POST /api/book-appointment
 * Validates required fields and inserts a new appointment into the database.
 */
export async function POST(request: NextRequest) {
  const body: BookAppointmentPayload = await request.json();

  // Validate required fields
  if (!body.name?.trim() || !body.phone?.trim() || !body.address?.trim()) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Name, phone, and address are required." },
      { status: 400 }
    );
  }

  // Validate email format if provided
  const rawEmail = body.email?.trim();
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Validate and normalise phone to 07XXXXXXXXX format
  const rawPhone = body.phone.trim().replace(/\s/g, "");
  if (!/^(?:\+447\d{9}|07\d{9}|7\d{9})$/.test(rawPhone)) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Please enter a valid UK mobile number." },
      { status: 400 }
    );
  }
  const phone = rawPhone.startsWith("+44")
    ? "0" + rawPhone.slice(3)
    : rawPhone.startsWith("7")
      ? "0" + rawPhone
      : rawPhone;

  // Validate and normalise postcode server-side
  const rawPostcode = (body.postcode ?? "").replace(/\s/g, "").toUpperCase();
//   console.log("Raw postcode:", body.postcode, "Cleaned postcode:", rawPostcode);
  if (!postcodes.has(rawPostcode.slice(0, -3))) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Invalid postcode." },
      { status: 400 }
    );
  }
  const postcode = rawPostcode

  if (!body.appointment_date || !body.appointment_time) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Date and time are required." },
      { status: 400 }
    );
  }

  // Validate service type (defaults to haircut if omitted)
  if (body.service && body.service !== "haircut" && body.service !== "haircut_shave") {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Invalid service type." },
      { status: 400 }
    );
  }
  const service: ServiceType = body.service ?? "haircut";

  // Re-check availability server-side: the requested slot (both slots for a
  // haircut+shave) must still be free given travel-time buffers.
  let blockedSlots: BookedSlot[];
  try {
    blockedSlots = await getBlockedSlots({
      from: body.appointment_date,
      to: body.appointment_date,
      userArea: rawPostcode.slice(0, -3),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Failed to book appointment. Please try again." },
      { status: 500 }
    );
  }

  if (!isStartTimeAvailable(blockedSlots, body.appointment_date, body.appointment_time, service)) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "This time slot is no longer available. Please pick another time." },
      { status: 409 }
    );
  }

  const { error } = await getSupabase().from("appointments").insert({
    name: body.name.trim(),
    phone,
    email: body.email?.trim() || null,
    address: body.address.trim(),
    postcode,
    service,
    appointment_date: body.appointment_date,
    appointment_time: body.appointment_time,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Failed to book appointment. Please try again." },
      { status: 500 }
    );
  }

  await sendBookingEmails({
    name: body.name.trim(),
    phone,
    email: rawEmail || null,
    address: body.address.trim(),
    postcode,
    service,
    appointment_date: body.appointment_date,
    appointment_time: body.appointment_time,
  });

  return NextResponse.json<BookAppointmentResponse>({ success: true });
}
