"use client";

import { ALL_TIMES, isStartTimeAvailable } from "@/lib/slots";
import type { BookedSlot, ServiceType } from "@/lib/types";

interface TimeSlotsProps {
  selectedDate: string;
  bookedSlots: BookedSlot[];
  service: ServiceType;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

/** Displays available 30-minute time slots for a given date. */
export default function TimeSlots({
  selectedDate,
  bookedSlots,
  service,
  selectedTime,
  onSelectTime,
}: TimeSlotsProps) {
  // For haircut+shave, the slot after the selected start is also part of the booking
  const secondSlot =
    service === "haircut_shave" && selectedTime
      ? ALL_TIMES[ALL_TIMES.indexOf(selectedTime) + 1]
      : null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Available times</h3>
      {service === "haircut_shave" && (
        <p className="mb-3 text-xs text-gray-500">
          Haircut + shave takes 1 hour, so your booking covers two consecutive slots.
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {ALL_TIMES.map((time) => {
          const isAvailable = isStartTimeAvailable(bookedSlots, selectedDate, time, service);
          const isSelected = selectedTime === time;
          const isSecondSlot = secondSlot === time;

          return (
            <button
              key={time}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectTime(time)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                ${isSelected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : isSecondSlot
                    ? "border-blue-300 bg-blue-100 text-blue-700"
                    : !isAvailable
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
