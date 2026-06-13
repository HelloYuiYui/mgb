import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { BookAppointmentPayload, BookAppointmentResponse, ServiceType } from "@/lib/types";
import { dijkstra, postcodes } from "../calculate-distance/route";
import {
  computeBlockedSlots,
  isStartTimeAvailable,
  type AppointmentSlotRow,
} from "@/lib/slots";

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
  const { data: existing, error: fetchError } = await getSupabase()
    .from("appointments")
    .select("appointment_date,appointment_time,postcode,service")
    .eq("appointment_date", body.appointment_date);

  if (fetchError) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Failed to book appointment. Please try again." },
      { status: 500 }
    );
  }

  const rows: AppointmentSlotRow[] = (existing ?? []).map((row) => ({
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
    postcode: row.postcode,
    service: (row.service ?? "haircut") as ServiceType,
  }));

  const blockedSlots = computeBlockedSlots(
    rows,
    rawPostcode.slice(0, -3),
    (from, to) => dijkstra(from, to)?.weight ?? null,
  );

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

  return NextResponse.json<BookAppointmentResponse>({ success: true });
}
