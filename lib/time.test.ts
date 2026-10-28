import { describe, expect, it } from "vitest";
import { addDays, bookingDateTimeError, bookingWindow, isPastSlot, londonNow } from "./time";

describe("londonNow", () => {
  it("uses BST in summer: 23:30 UTC is already tomorrow in London", () => {
    expect(londonNow(new Date("2026-06-15T23:30:00Z"))).toEqual({ date: "2026-06-16", time: "00:30" });
  });

  it("uses GMT in winter", () => {
    expect(londonNow(new Date("2026-12-15T23:30:00Z"))).toEqual({ date: "2026-12-15", time: "23:30" });
  });

  it("handles the clocks going back (25 Oct 2026)", () => {
    expect(londonNow(new Date("2026-10-25T00:30:00Z"))).toEqual({ date: "2026-10-25", time: "01:30" });
    expect(londonNow(new Date("2026-10-25T01:30:00Z"))).toEqual({ date: "2026-10-25", time: "01:30" });
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-25", 14)).toBe("2027-01-08");
  });

  it("is unaffected by DST changes", () => {
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });
});

describe("bookingWindow", () => {
  it("spans today to 14 days ahead", () => {
    expect(bookingWindow({ date: "2026-10-18", time: "12:00" })).toEqual({
      from: "2026-10-18",
      to: "2026-11-01",
    });
  });
});

describe("isPastSlot", () => {
  const now = { date: "2026-10-20", time: "14:10" };

  it("treats earlier days as past", () => {
    expect(isPastSlot("2026-10-19", "19:00", now)).toBe(true);
  });

  it("treats today's slots at or before now as past", () => {
    expect(isPastSlot("2026-10-20", "14:00", now)).toBe(true);
    expect(isPastSlot("2026-10-20", "14:00", { ...now, time: "14:00" })).toBe(true);
    expect(isPastSlot("2026-10-20", "14:30", now)).toBe(false);
  });

  it("treats later days as not past", () => {
    expect(isPastSlot("2026-10-21", "10:00", now)).toBe(false);
  });
});

describe("bookingDateTimeError", () => {
  const now = { date: "2026-10-20", time: "14:10" };

  it("accepts a future slot today and the last day of the window", () => {
    expect(bookingDateTimeError("2026-10-20", "14:30", now)).toBeNull();
    expect(bookingDateTimeError("2026-11-03", "19:00", now)).toBeNull();
  });

  it("rejects a past slot today", () => {
    expect(bookingDateTimeError("2026-10-20", "14:00", now)).toMatch(/already passed/);
  });

  it("rejects yesterday", () => {
    expect(bookingDateTimeError("2026-10-19", "15:00", now)).toMatch(/already passed/);
  });

  it("rejects 15 days out", () => {
    expect(bookingDateTimeError("2026-11-04", "10:00", now)).toMatch(/14 days/);
  });

  it("rejects malformed or off-grid values", () => {
    expect(bookingDateTimeError("2026-02-30", "10:00", now)).toMatch(/Invalid/);
    expect(bookingDateTimeError("20/10/2026", "10:00", now)).toMatch(/Invalid/);
    expect(bookingDateTimeError("2026-10-21", "10:15", now)).toMatch(/Invalid/);
    expect(bookingDateTimeError("2026-10-21", "09:30", now)).toMatch(/Invalid/);
  });
});
