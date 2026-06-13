/** Type of service being booked. Haircut + shave occupies two consecutive slots. */
export type ServiceType = "haircut" | "haircut_shave";

/** Represents an appointment stored in the database. */
export interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  postcode: string;
  service: ServiceType;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  created_at: string;
}

/** A blocked slot returned from the API. */
export interface BookedSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  area: string; // Postcode for future filtering (not currently used)
  kind: "booked" | "buffer"; // "booked" = occupied by an appointment, "buffer" = travel-time block
}

/** Response from POST /api/validate-postcode */
export interface ValidatePostcodeResponse {
  valid: boolean;
  error?: string;
  bookedSlots: BookedSlot[];
}

/** Payload sent to POST /api/book-appointment */
export interface BookAppointmentPayload {
  name: string;
  phone: string;
  email?: string;
  address: string;
  postcode: string;
  service: ServiceType;
  appointment_date: string;
  appointment_time: string;
}

/** Response from POST /api/book-appointment */
export interface BookAppointmentResponse {
  success: boolean;
  error?: string;
}
