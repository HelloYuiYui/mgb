"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

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

/** Booking confirmation page — displays a summary after successful booking. */
export default function ConfirmationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;

    const storedName = sessionStorage.getItem("mgb_booking_name");
    const storedDate = sessionStorage.getItem("mgb_date");
    const storedTime = sessionStorage.getItem("mgb_time");

    if (!storedName || !storedDate || !storedTime) {
      router.replace("/");
      return;
    }

    loaded.current = true;

    setName(storedName);
    setDate(storedDate);
    setTime(storedTime);

    // Clear session data after displaying confirmation
    sessionStorage.removeItem("mgb_postcode");
    sessionStorage.removeItem("mgb_booked_slots");
    sessionStorage.removeItem("mgb_date");
    sessionStorage.removeItem("mgb_time");
    sessionStorage.removeItem("mgb_booking_name");
  }, [router]);

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

        {name && date && time && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6 text-left">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Name:</span> {name}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Date:</span> {formatDate(date)}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Time:</span> {time}
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
