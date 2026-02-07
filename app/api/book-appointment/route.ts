import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { BookAppointmentPayload, BookAppointmentResponse } from "@/lib/types";

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

  // Validate postcode again server-side
  const postcode = body.postcode?.trim().toUpperCase();
  if (!postcode || postcode.length !== 6 || !postcode.startsWith("G")) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Invalid postcode." },
      { status: 400 }
    );
  }

  if (!body.appointment_date || !body.appointment_time) {
    return NextResponse.json<BookAppointmentResponse>(
      { success: false, error: "Date and time are required." },
      { status: 400 }
    );
  }

  const { error } = await getSupabase().from("appointments").insert({
    name: body.name.trim(),
    phone,
    email: body.email?.trim() || null,
    address: body.address.trim(),
    postcode,
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
