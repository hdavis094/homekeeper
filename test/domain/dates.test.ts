import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  daysBetween,
  isValidDateString,
  monthRange,
  todayIn,
} from "@/lib/domain/dates";

describe("todayIn", () => {
  it("returns the calendar date in the given time zone", () => {
    // 2026-03-07 03:30 UTC is still March 6 in New York (UTC-5).
    const now = new Date("2026-03-07T03:30:00Z");
    expect(todayIn("America/New_York", now)).toBe("2026-03-06");
    expect(todayIn("UTC", now)).toBe("2026-03-07");
    expect(todayIn("Asia/Tokyo", now)).toBe("2026-03-07");
  });

  it("falls back to New York for an unknown time zone", () => {
    const now = new Date("2026-03-07T03:30:00Z");
    expect(todayIn("Not/AZone", now)).toBe("2026-03-06");
  });
});

describe("addDays", () => {
  it("adds and subtracts calendar days across month and year ends", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-03-07", 0)).toBe("2026-03-07");
  });

  it("is not affected by DST changes", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
  });
});

describe("addMonths", () => {
  it("clamps to the last day of shorter months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-15", -3)).toBe("2025-12-15");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days from a to b", () => {
    expect(daysBetween("2026-03-06", "2026-03-09")).toBe(3);
    expect(daysBetween("2026-03-06", "2026-03-04")).toBe(-2);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });
});

describe("isValidDateString", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-3-1")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

describe("monthRange", () => {
  it("returns the first and last day of the month containing a date", () => {
    expect(monthRange("2026-02-14")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange("2026-12-01")).toEqual({ start: "2026-12-01", end: "2026-12-31" });
  });
});
