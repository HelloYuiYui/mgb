import { describe, expect, it } from "vitest";
import {
  type AppointmentSlotRow,
  computeBlockedSlots,
  isStartTimeAvailable,
  occupiedTimes,
  toArea,
} from "./slots";

const DATE = "2026-10-20";

/** Stub travel times keyed by "from|to" area, so tests don't depend on the real graph. */
function travel(times: Record<string, number | null>) {
  return (from: string, to: string) => times[`${from}|${to}`] ?? 0;
}

const FAR = travel({ "G1|G51": 30 });
const NEAR = travel({ "G1|G51": 15 });

function row(time: string, service: AppointmentSlotRow["service"]): AppointmentSlotRow {
  return { date: DATE, time, postcode: "G51 2AA", service };
}

/** Blocked slots as "time:kind" strings, sorted by time, for compact assertions. */
function summary(rows: AppointmentSlotRow[], userArea: string | null, getTravelTime = FAR) {
  return computeBlockedSlots(rows, userArea, getTravelTime)
    .map((s) => `${s.time}:${s.kind}`)
    .sort();
}

describe("toArea", () => {
  it("extracts the outward code", () => {
    expect(toArea("G51 2AA")).toBe("G51");
    expect(toArea("g12aa")).toBe("G1");
  });
});

describe("occupiedTimes", () => {
  it("a haircut occupies one slot", () => {
    expect(occupiedTimes("14:00", "haircut")).toEqual(["14:00"]);
  });

  it("a haircut + shave occupies two consecutive slots", () => {
    expect(occupiedTimes("14:00", "haircut_shave")).toEqual(["14:00", "14:30"]);
  });

  it("a haircut + shave at the last slot occupies only that slot", () => {
    expect(occupiedTimes("19:00", "haircut_shave")).toEqual(["19:00"]);
  });
});

describe("computeBlockedSlots", () => {
  it("marks occupied slots as booked", () => {
    expect(summary([row("14:00", "haircut_shave")], null)).toEqual([
      "14:00:booked",
      "14:30:booked",
    ]);
  });

  it("adds buffers before and after a far haircut", () => {
    expect(summary([row("14:00", "haircut")], "G1")).toEqual([
      "13:30:buffer",
      "14:00:booked",
      "14:30:buffer",
    ]);
  });

  it("adds a buffer only before a far haircut + shave", () => {
    expect(summary([row("14:00", "haircut_shave")], "G1")).toEqual([
      "13:30:buffer",
      "14:00:booked",
      "14:30:booked",
    ]);
  });

  it("adds no buffers when travel is 15 minutes or less", () => {
    expect(summary([row("14:00", "haircut")], "G1", NEAR)).toEqual(["14:00:booked"]);
  });

  it("adds no buffers when the area is unreachable", () => {
    expect(summary([row("14:00", "haircut")], "G1", () => null)).toEqual(["14:00:booked"]);
  });

  it("adds no buffers without a user area", () => {
    expect(summary([row("14:00", "haircut")], null)).toEqual(["14:00:booked"]);
  });

  it("skips buffers that would fall outside the day", () => {
    expect(summary([row("10:00", "haircut")], "G1")).toEqual(["10:00:booked", "10:30:buffer"]);
    expect(summary([row("19:00", "haircut")], "G1")).toEqual(["18:30:buffer", "19:00:booked"]);
  });

  it("booked takes precedence over buffer for the same slot", () => {
    // Each far haircut's buffer lands on the other's booked slot.
    const rows = [row("14:00", "haircut"), row("14:30", "haircut")];
    const blocked = computeBlockedSlots(rows, "G1", FAR);
    expect(blocked.filter((s) => s.time === "14:30")).toEqual([
      { date: DATE, time: "14:30", area: "G51 2AA", kind: "booked" },
    ]);
    expect(blocked.filter((s) => s.time === "14:00").map((s) => s.kind)).toEqual(["booked"]);
  });

  it("keeps slots on different dates separate", () => {
    const rows = [row("14:00", "haircut"), { ...row("14:00", "haircut"), date: "2026-10-21" }];
    expect(computeBlockedSlots(rows, null, FAR)).toHaveLength(2);
  });
});

describe("isStartTimeAvailable", () => {
  const booked = computeBlockedSlots([row("14:30", "haircut")], null, FAR);
  const buffered = computeBlockedSlots([row("15:00", "haircut")], "G1", FAR); // buffer at 14:30

  it("rejects times outside the slot grid", () => {
    expect(isStartTimeAvailable([], DATE, "14:15", "haircut")).toBe(false);
    expect(isStartTimeAvailable([], DATE, "09:30", "haircut")).toBe(false);
  });

  it("rejects a blocked start slot", () => {
    expect(isStartTimeAvailable(booked, DATE, "14:30", "haircut")).toBe(false);
    expect(isStartTimeAvailable(buffered, DATE, "14:30", "haircut")).toBe(false);
  });

  it("only checks blocks on the same date", () => {
    expect(isStartTimeAvailable(booked, "2026-10-21", "14:30", "haircut")).toBe(true);
  });

  it("a haircut can start right before a booked slot", () => {
    expect(isStartTimeAvailable(booked, DATE, "14:00", "haircut")).toBe(true);
  });

  it("a haircut + shave can't start right before a booked slot", () => {
    expect(isStartTimeAvailable(booked, DATE, "14:00", "haircut_shave")).toBe(false);
  });

  it("a haircut + shave can start right before a buffer slot", () => {
    expect(isStartTimeAvailable(buffered, DATE, "14:00", "haircut_shave")).toBe(true);
  });

  it("a haircut + shave can start at the last slot", () => {
    expect(isStartTimeAvailable([], DATE, "19:00", "haircut_shave")).toBe(true);
  });
});
