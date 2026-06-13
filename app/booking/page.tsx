"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
import TimeSlots from "@/components/TimeSlots";
import { SERVICE_LABELS } from "@/lib/slots";
import type { BookedSlot, ServiceType } from "@/lib/types";

/** Booking page — service, date and time selection. */
export default function BookingPage() {
  const router = useRouter();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [service, setService] = useState<ServiceType>("haircut");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch booked slots from the database on mount
  useEffect(() => {
    const postcode = sessionStorage.getItem("mgb_postcode");

    // Redirect back if no postcode in session (user navigated directly)
    if (!postcode) {
      router.replace("/book");
      return;
    }

    async function fetchBookedSlots() {
      try {
        const res = await fetch(`/api/booked-slots?postcode=${encodeURIComponent(postcode!)}`);
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

  // Reset time selection when service changes — a valid haircut start
  // may not be a valid haircut+shave start (and vice versa)
  function handleServiceSelect(next: ServiceType) {
    setService(next);
    setSelectedTime(null);
  }

  function handleProceed() {
    if (!selectedDate || !selectedTime) return;
    sessionStorage.setItem("mgb_service", service);
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
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">Service</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleServiceSelect(type)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors
                      ${service === type
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                  >
                    {SERVICE_LABELS[type]}
                    <span className={`block text-xs font-normal ${service === type ? "text-blue-100" : "text-gray-500"}`}>
                      {type === "haircut" ? "30 min" : "1 hour"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Calendar
              bookedSlots={bookedSlots}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />

            {selectedDate && (
              <TimeSlots
                selectedDate={selectedDate}
                bookedSlots={bookedSlots}
                service={service}
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
