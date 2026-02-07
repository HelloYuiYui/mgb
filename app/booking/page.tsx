"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
import TimeSlots from "@/components/TimeSlots";
import type { BookedSlot } from "@/lib/types";

/** Booking page — date and time selection. */
export default function BookingPage() {
  const router = useRouter();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch booked slots from the database on mount
  useEffect(() => {
    const postcode = sessionStorage.getItem("mgb_postcode");

    // Redirect back if no postcode in session (user navigated directly)
    if (!postcode) {
      router.replace("/");
      return;
    }

    async function fetchBookedSlots() {
      try {
        const res = await fetch("/api/booked-slots");
        const data = await res.json();
        if (data.bookedSlots) {
          setBookedSlots(data.bookedSlots as BookedSlot[]);
        }
      } catch {
        // Slots will remain empty — all times shown as available
      } finally {
        setLoading(false);
      }
    }

    fetchBookedSlots();
  }, [router]);

  // Reset time selection when date changes
  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleProceed() {
    if (!selectedDate || !selectedTime) return;
    sessionStorage.setItem("mgb_date", selectedDate);
    sessionStorage.setItem("mgb_time", selectedTime);
    router.push("/booking/details");
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <Header title="Select a suitable date and time" />

      <div className="w-full max-w-md space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading availability...</p>
        ) : (
          <>
            <Calendar
              bookedSlots={bookedSlots}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />

            {selectedDate && (
              <TimeSlots
                selectedDate={selectedDate}
                bookedSlots={bookedSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            )}

            <button
              type="button"
              disabled={!selectedDate || !selectedTime}
              onClick={handleProceed}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white
                         shadow-sm transition-colors hover:bg-blue-700 focus:outline-none
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed
            </button>
          </>
        )}
      </div>
    </main>
  );
}
