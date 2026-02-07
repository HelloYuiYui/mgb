"use client";

import type { BookedSlot } from "@/lib/types";

/** All available time slots in a day (10:00–19:00 at 30-min intervals). */
const ALL_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

interface TimeSlotsProps {
  selectedDate: string;
  bookedSlots: BookedSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

/** Displays available 30-minute time slots for a given date. */
export default function TimeSlots({
  selectedDate,
  bookedSlots,
  selectedTime,
  onSelectTime,
}: TimeSlotsProps) {
  // Collect booked times for the selected date
  const bookedTimes = new Set(
    bookedSlots
      .filter((s) => s.date === selectedDate)
      .map((s) => s.time)
  );

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Available times</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {ALL_TIMES.map((time) => {
          const isBooked = bookedTimes.has(time);
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              type="button"
              disabled={isBooked}
              onClick={() => onSelectTime(time)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${isSelected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : isBooked
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                }`}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
