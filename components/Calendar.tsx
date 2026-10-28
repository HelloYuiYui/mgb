"use client";

import { ALL_TIMES } from "@/lib/slots";
import type { BookedSlot } from "@/lib/types";
import { addDays, isPastSlot, londonNow, type LondonNow } from "@/lib/time";

interface CalendarProps {
  bookedSlots: BookedSlot[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

/** The next 14 days starting from today in Europe/London, as local-midnight Dates for display. */
function getNext14Days(now: LondonNow): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const [y, m, d] = addDays(now.date, i).split("-").map(Number);
    days.push(new Date(y, m - 1, d));
  }
  return days;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekday(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function dayNum(d: Date): number {
  return d.getDate();
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short" });
}

/** 14-day date picker grid. Days with all slots booked/blocked/past are disabled. */
export default function Calendar({ bookedSlots, selectedDate, onSelectDate }: CalendarProps) {
  const now = londonNow();
  const days = getNext14Days(now);

  const bookedByDate = new Map<string, Set<string>>();
  for (const slot of bookedSlots) {
    if (!bookedByDate.has(slot.date)) bookedByDate.set(slot.date, new Set());
    bookedByDate.get(slot.date)!.add(slot.time);
  }

  // A day is full when every slot is blocked or has already started (later today)
  function isFullyBooked(dateStr: string): boolean {
    const booked = bookedByDate.get(dateStr);
    return ALL_TIMES.every((t) => booked?.has(t) || isPastSlot(dateStr, t, now));
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
