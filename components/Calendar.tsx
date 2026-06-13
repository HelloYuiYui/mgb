"use client";

import { ALL_TIMES } from "@/lib/slots";
import type { BookedSlot } from "@/lib/types";

interface CalendarProps {
  bookedSlots: BookedSlot[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

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

/** 14-day date picker grid. Days with all slots booked/blocked are disabled. */
export default function Calendar({ bookedSlots, selectedDate, onSelectDate }: CalendarProps) {
  const days = getNext14Days();

  const bookedByDate = new Map<string, Set<string>>();
  for (const slot of bookedSlots) {
    if (!bookedByDate.has(slot.date)) bookedByDate.set(slot.date, new Set());
    bookedByDate.get(slot.date)!.add(slot.time);
  }

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
