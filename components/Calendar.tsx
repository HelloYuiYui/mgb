"use client";

import { useEffect, useState } from "react";
import type { BookedSlot } from "@/lib/types";

/** All available time slots in a day (10:00–19:00 at 30-min intervals). */
const ALL_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

interface CalendarProps {
  bookedSlots: BookedSlot[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

/** Generates the next 14 days starting from today. */
function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Formats a Date to YYYY-MM-DD. */
function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Short weekday label. */
function weekday(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

/** Day of month. */
function dayNum(d: Date): number {
  return d.getDate();
}

/** Month abbreviation. */
function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short" });
}

/** 14-day date picker grid. Days with all slots booked are disabled. */
export default function Calendar({ bookedSlots, selectedDate, onSelectDate }: CalendarProps) {
  const days = getNext14Days();

  const [bookedByDate, setBookedByDate] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    // Initialise from bookedSlots
    const initial = new Map<string, Set<string>>();
    for (const slot of bookedSlots) {
      if (!initial.has(slot.date)) {
        initial.set(slot.date, new Set());
      }
      initial.get(slot.date)!.add(slot.time);
    }

    const postcode = sessionStorage.getItem("mgb_postcode");
    if (!postcode || bookedSlots.length === 0) {
      setBookedByDate(initial);
      return;
    }

    async function fetchDistances() {
      for (const slot of bookedSlots) {
        if (slot.area === "") {
            continue; // Skip distance checks for already marked unavailable slots
        }
        const res = await fetch("/api/calculate-distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: postcode, end: slot.area}),
        });
        const { distance } = await res.json();
        // console.log(`Distance from ${postcode} to ${slot.area}:`, distance);
        if (distance > 15) {
            // console.log(`Slot on ${slot.date} at ${slot.time} is more than 15 minutes away. Marking next slot as unavailable.`);
            const prevTime = ALL_TIMES[ALL_TIMES.indexOf(slot.time) - 1];
            if (prevTime) {
                if (!initial.has(slot.date)) {
                    initial.set(slot.date, new Set());
                }
                initial.get(slot.date)!.add(prevTime);
                // console.log(`Marked ${slot.date} at ${prevTime} as unavailable due to distance constraint.`);
            }

            const nextTime = ALL_TIMES[ALL_TIMES.indexOf(slot.time) + 1];
            if (nextTime) {
                if (!initial.has(slot.date)) {
                    initial.set(slot.date, new Set());
                }
                initial.get(slot.date)!.add(nextTime);
                // console.log(`Marked ${slot.date} at ${nextTime} as unavailable due to distance constraint.`);
            }
        }
      }
      setBookedByDate(new Map(initial));
    }

    fetchDistances();
  }, [bookedSlots]);

  for (const date of bookedByDate.keys()) {
    for (const time of bookedByDate.get(date)!) {
        bookedSlots.push({ date, time, area: "" }); // Add distance-unavailable slots to bookedSlots for consistency
    }
  }
  /** Returns true if every time slot on a given date is booked. */
  function isFullyBooked(dateStr: string): boolean {
    const booked = bookedByDate.get(dateStr);
    if (!booked) return false;
    return ALL_TIMES.every((t) => booked.has(t));
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const dateStr = toDateString(d);
        const fullyBooked = isFullyBooked(dateStr);
        const isSelected = selectedDate === dateStr;

        return (
          <button
            key={dateStr}
            type="button"
            disabled={fullyBooked}
            onClick={() => onSelectDate(dateStr)}
            className={`flex flex-col items-center rounded-lg border p-2 text-sm transition-colors
              ${isSelected
                ? "border-blue-600 bg-blue-600 text-white"
                : fullyBooked
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <span className="text-xs font-medium">{weekday(d)}</span>
            <span className="text-lg font-bold">{dayNum(d)}</span>
            <span className="text-xs">{monthLabel(d)}</span>
          </button>
        );
      })}
    </div>
  );
}
