import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookingWindow, getBlockedSlots } from "./availability";

// Records the filters applied to the appointments query and returns `result`.
const query = vi.hoisted(() => ({
  filters: [] as [string, string, string][],
  result: { data: [] as unknown[] | null, error: null as { message: string } | null },
}));

vi.mock("./supabase", () => {
  const builder = {
    select: () => builder,
    gte: (col: string, val: string) => (query.filters.push(["gte", col, val]), builder),
    lte: (col: string, val: string) => (query.filters.push(["lte", col, val]), Promise.resolve(query.result)),
  };
  return { getSupabase: () => ({ from: () => builder }) };
});

vi.mock("@/app/api/calculate-distance/route", () => ({
  dijkstra: (from: string, to: string) => (from === to ? { weight: 0, path: [] } : { weight: 30, path: [] }),
}));

beforeEach(() => {
  query.filters = [];
  query.result = { data: [], error: null };
});

describe("bookingWindow", () => {
  it("spans today to 14 days ahead", () => {
    vi.useFakeTimers({ now: new Date("2026-10-18T12:00:00Z") });
    expect(bookingWindow()).toEqual({ from: "2026-10-18", to: "2026-11-01" });
    vi.useRealTimers();
  });
});

describe("getBlockedSlots", () => {
  it("only queries appointments within [from, to]", async () => {
    await getBlockedSlots({ from: "2026-10-18", to: "2026-11-01", userArea: null });
    expect(query.filters).toEqual([
      ["gte", "appointment_date", "2026-10-18"],
      ["lte", "appointment_date", "2026-11-01"],
    ]);
  });

  it("maps rows: trims seconds and defaults the service to haircut", async () => {
    query.result.data = [
      { appointment_date: "2026-10-20", appointment_time: "14:00:00", postcode: "G51 2AA", service: null },
    ];
    expect(await getBlockedSlots({ from: "2026-10-20", to: "2026-10-20", userArea: null })).toEqual([
      { date: "2026-10-20", time: "14:00", area: "G51 2AA", kind: "booked" },
    ]);
  });

  it("includes travel buffers for a far user area", async () => {
    query.result.data = [
      { appointment_date: "2026-10-20", appointment_time: "14:00:00", postcode: "G51 2AA", service: "haircut" },
    ];
    const slots = await getBlockedSlots({ from: "2026-10-20", to: "2026-10-20", userArea: "G1" });
    expect(slots.map((s) => `${s.time}:${s.kind}`).sort()).toEqual([
      "13:30:buffer",
      "14:00:booked",
      "14:30:buffer",
    ]);
  });

  it("throws when the query fails", async () => {
    query.result = { data: null, error: { message: "boom" } };
    await expect(getBlockedSlots({ from: "2026-10-20", to: "2026-10-20", userArea: null })).rejects.toThrow(
      "boom",
    );
  });
});
