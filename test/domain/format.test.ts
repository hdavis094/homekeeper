import { describe, expect, it } from "vitest";
import { formatMonthYear, formatShortDate } from "@/lib/domain/dates";
import { dollarsToCents, formatCents, initials } from "@/lib/domain/format";

describe("formatCents", () => {
  it("formats integer cents as USD", () => {
    expect(formatCents(12_550)).toBe("$125.50");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123_456_789)).toBe("$1,234,567.89");
  });

  it("can drop the cents for whole-dollar summaries", () => {
    expect(formatCents(12_550, { whole: true })).toBe("$126");
    expect(formatCents(240_000, { whole: true })).toBe("$2,400");
  });
});

describe("dollarsToCents", () => {
  it.each([
    ["125.50", 12_550],
    ["125.5", 12_550],
    ["$1,234.99", 123_499],
    ["  80 ", 8_000],
    ["0", 0],
    ["0.07", 7],
  ])("%s → %i", (input, cents) => {
    expect(dollarsToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1.234", "1.2.3"])("rejects %j", (input) => {
    expect(dollarsToCents(input)).toBeNull();
  });
});

describe("formatShortDate / formatMonthYear", () => {
  it("formats calendar dates without time-zone drift", () => {
    expect(formatShortDate("2026-09-28", "2026-10-29")).toBe("Sep 28");
    expect(formatShortDate("2025-09-28", "2026-10-29")).toBe("Sep 28, 2025");
    expect(formatMonthYear("2026-01-01")).toBe("Jan 2026");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Alex Morgan")).toBe("AM");
    expect(initials("Mike's Plumbing Co.")).toBe("MP");
    expect(initials("  cher ")).toBe("C");
    expect(initials("")).toBe("?");
  });
});
