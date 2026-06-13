"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { SERVICE_LABELS } from "@/lib/slots";

/** Formats a date string (YYYY-MM-DD) into a human-readable label. */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface BookingSummary {
  name: string;
  service: string;
  date: string;
  time: string;
}

/** sessionStorage never notifies of changes — subscription is a no-op. */
const emptySubscribe = () => () => {};

function readBookingFromSession(): BookingSummary | null {
  const name = sessionStorage.getItem("mgb_booking_name");
  const date = sessionStorage.getItem("mgb_date");
  const time = sessionStorage.getItem("mgb_time");
  const service = sessionStorage.getItem("mgb_service");

  if (!name || !date || !time) return null;
  return {
    name,
    date,
    time,
    service:
      service === "haircut_shave"
        ? SERVICE_LABELS.haircut_shave
        : SERVICE_LABELS.haircut,
  };
}

/** Booking confirmation page — displays a summary after successful booking. */
export default function ConfirmationPage() {
  const router = useRouter();

  // Read the summary once per mount and cache it, so it stays on screen
  // after the session data is cleared below.
  const cache = useRef<BookingSummary | null | undefined>(undefined);
  const booking = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (cache.current === undefined) cache.current = readBookingFromSession();
      return cache.current;
    },
    () => null, // server snapshot — page is prerendered without a summary
  );

  useEffect(() => {
    if (booking) {
      // Clear session data after displaying confirmation
      sessionStorage.removeItem("mgb_postcode");
      sessionStorage.removeItem("mgb_booked_slots");
      sessionStorage.removeItem("mgb_service");
      sessionStorage.removeItem("mgb_date");
      sessionStorage.removeItem("mgb_time");
      sessionStorage.removeItem("mgb_booking_name");
      return;
    }
    // Only redirect once the session has definitively been read as empty —
    // during hydration `booking` is still the null server snapshot.
    if (cache.current === null) router.replace("/book");
  }, [booking, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <Header title="Booking confirmed!" />

        {booking && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6 text-left">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Name:</span> {booking.name}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Service:</span> {booking.service}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Date:</span> {formatDate(booking.date)}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Time:</span> {booking.time}
            </p>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500">
          Thank you for booking with MG Barbers. We look forward to seeing you!
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium
                     text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back to home
        </button>
      </div>
    </main>
  );
}
