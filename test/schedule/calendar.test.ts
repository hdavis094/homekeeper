import { describe, expect, it } from "vitest";
import {
  buildMonthMatrix,
  chipLabel,
  formatDayHeading,
  formatMonthHeading,
  groupEntriesByDay,
  monthDateRange,
  nextMonthParam,
  parseMonthParam,
  parseViewParam,
  prevMonthParam,
  scheduleHref,
} from "@/app/ui/schedule/calendar";
import type { CalendarEntry } from "@/lib/data/tasks";

describe("parseMonthParam", () => {
  it("parses valid YYYY-MM strings", () => {
    expect(parseMonthParam("2026-03", "2026-10-29")).toEqual({
      year: 2026,
      month: 3,
      monthParam: "2026-03",
    });
    expect(parseMonthParam("2026-12", "2026-10-29")).toEqual({
      year: 2026,
      month: 12,
      monthParam: "2026-12",
    });
  });

  it("falls back to the current month from today when missing or invalid", () => {
    expect(parseMonthParam(undefined, "2026-10-29")).toEqual({
      year: 2026,
      month: 10,
      monthParam: "2026-10",
    });
    expect(parseMonthParam("", "2026-10-29")).toEqual({
      year: 2026,
      month: 10,
      monthParam: "2026-10",
    });
    expect(parseMonthParam("2026-13", "2026-10-29")).toEqual({
      year: 2026,
      month: 10,
      monthParam: "2026-10",
    });
    expect(parseMonthParam("2026-00", "2026-10-29")).toEqual({
      year: 2026,
      month: 10,
      monthParam: "2026-10",
    });
    expect(parseMonthParam("not-a-month", "2026-03-07")).toEqual({
      year: 2026,
      month: 3,
      monthParam: "2026-03",
    });
    expect(parseMonthParam(["2026-04", "2026-05"], "2026-03-07")).toEqual({
      year: 2026,
      month: 4,
      monthParam: "2026-04",
    });
  });
});

describe("parseViewParam", () => {
  it("returns 'list' only when view is 'list', otherwise 'month'", () => {
    expect(parseViewParam("list")).toBe("list");
    expect(parseViewParam(["list", "month"])).toBe("list");
    expect(parseViewParam("month")).toBe("month");
    expect(parseViewParam(undefined)).toBe("month");
    expect(parseViewParam("other")).toBe("month");
  });
});

describe("prevMonthParam and nextMonthParam", () => {
  it("computes previous and next YYYY-MM across year boundaries", () => {
    expect(prevMonthParam("2026-03")).toBe("2026-02");
    expect(nextMonthParam("2026-03")).toBe("2026-04");
    expect(prevMonthParam("2026-01")).toBe("2025-12");
    expect(nextMonthParam("2026-12")).toBe("2027-01");
  });
});

describe("scheduleHref", () => {
  it("builds schedule URLs preserving month and view", () => {
    expect(scheduleHref({ month: "2026-03", view: "month" })).toBe(
      "/schedule?month=2026-03"
    );
    expect(scheduleHref({ month: "2026-03", view: "list" })).toBe(
      "/schedule?month=2026-03&view=list"
    );
  });
});

describe("formatMonthHeading and formatDayHeading", () => {
  it("formats YYYY-MM as full month name and year", () => {
    expect(formatMonthHeading("2026-03")).toBe("March 2026");
    expect(formatMonthHeading("2026-10")).toBe("October 2026");
    expect(formatMonthHeading("2025-12")).toBe("December 2025");
  });

  it("formats YYYY-MM-DD as readable weekday and date", () => {
    expect(formatDayHeading("2026-03-02")).toBe("Monday, March 2");
    expect(formatDayHeading("2026-03-14")).toBe("Saturday, March 14");
  });
});

describe("monthDateRange", () => {
  it("returns the first and last YYYY-MM-DD of the month", () => {
    expect(monthDateRange("2026-03")).toEqual({
      from: "2026-03-01",
      to: "2026-03-31",
    });
    expect(monthDateRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(monthDateRange("2028-02")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });
});

describe("buildMonthMatrix", () => {
  it("builds a 5-row Sunday-first matrix for March 2026 (starts on Sunday)", () => {
    const weeks = buildMonthMatrix("2026-03");
    expect(weeks).toHaveLength(5);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
    expect(weeks[0]![0]).toEqual({
      date: "2026-03-01",
      dayOfMonth: 1,
      inCurrentMonth: true,
    });
    expect(weeks[4]![2]).toEqual({
      date: "2026-03-31",
      dayOfMonth: 31,
      inCurrentMonth: true,
    });
    expect(weeks[4]![3]).toEqual({
      date: null,
      dayOfMonth: null,
      inCurrentMonth: false,
    });
    expect(weeks[4]![6]).toEqual({
      date: null,
      dayOfMonth: null,
      inCurrentMonth: false,
    });
  });

  it("builds a 6-row matrix when a 31-day month starts on Friday or Saturday", () => {
    // May 2026 starts on Friday (index 5) and has 31 days -> 5 + 31 = 36 cells -> 6 weeks
    const weeks = buildMonthMatrix("2026-05");
    expect(weeks).toHaveLength(6);
    expect(
      weeks[0]!.slice(0, 5).every((c) => !c.inCurrentMonth && c.date === null)
    ).toBe(true);
    expect(weeks[0]![5]).toEqual({
      date: "2026-05-01",
      dayOfMonth: 1,
      inCurrentMonth: true,
    });
    expect(weeks[5]![0]).toEqual({
      date: "2026-05-31",
      dayOfMonth: 31,
      inCurrentMonth: true,
    });
  });

  it("pads a 4-week February to 5 rows so the calendar always has 5-6 week rows", () => {
    // Feb 2026 starts on Sunday (2026-02-01) and has 28 days
    const weeks = buildMonthMatrix("2026-02");
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]?.date).toBe("2026-02-01");
    expect(weeks[3]![6]?.date).toBe("2026-02-28");
    expect(weeks[4]!.every((c) => !c.inCurrentMonth && c.date === null)).toBe(
      true
    );
  });
});

describe("chipLabel and groupEntriesByDay", () => {
  const sampleEntries: CalendarEntry[] = [
    {
      key: "t1",
      kind: "task",
      taskId: "t1",
      title: "Inspect Sump Pump",
      location: "Basement",
      date: "2026-03-02",
      status: "overdue",
    },
    {
      key: "t2",
      kind: "task",
      taskId: "t2",
      title: "Replace HVAC Filter",
      location: "Living Room",
      date: "2026-03-09",
      status: "due_soon",
    },
    {
      key: "t3",
      kind: "completion",
      taskId: "t3",
      title: "Replace Furnace Igniter",
      location: "Basement",
      date: "2026-03-09",
      status: "completed",
    },
  ];

  it("prefixes overdue entries with 'Overdue: ' and leaves other statuses unchanged", () => {
    expect(chipLabel(sampleEntries[0]!)).toBe("Overdue: Inspect Sump Pump");
    expect(chipLabel(sampleEntries[1]!)).toBe("Replace HVAC Filter");
    expect(chipLabel(sampleEntries[2]!)).toBe("Replace Furnace Igniter");
  });

  it("groups entries by date in ascending date order", () => {
    const groups = groupEntriesByDay(sampleEntries);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.date).toBe("2026-03-02");
    expect(groups[0]?.entries.map((e) => e.key)).toEqual(["t1"]);
    expect(groups[1]?.date).toBe("2026-03-09");
    expect(groups[1]?.entries.map((e) => e.key)).toEqual(["t2", "t3"]);
  });
});
