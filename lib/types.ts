/** Represents an appointment stored in the database. */
export interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  postcode: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  created_at: string;
}

/** A booked slot returned from the API (date + time only). */
export interface BookedSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
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
  appointment_date: string;
  appointment_time: string;
}

/** Response from POST /api/book-appointment */
export interface BookAppointmentResponse {
  success: boolean;
  error?: string;
}
