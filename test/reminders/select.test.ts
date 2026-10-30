import { describe, expect, it } from "vitest";
import { getReminderDay, selectTasksToRemind, shouldSendWeeklySummary } from "@/app/api/cron/reminders/select";

const today = "2026-11-02";
const task = (id: string, dueDate: string, completedAt: string | null = null) => ({ id, dueDate, completedAt });

describe("selectTasksToRemind", () => {
  it("includes every overdue task and tasks due today through three days out, in due order", () => {
    const tasks = [
      task("three-days", "2026-11-05"),
      task("tomorrow", "2026-11-03"),
      task("old", "2025-01-01"),
      task("today", today),
      task("yesterday", "2026-11-01"),
      task("two-days", "2026-11-04"),
      task("too-late", "2026-11-06"),
    ];
    expect(selectTasksToRemind(tasks, today).map((t) => t.id)).toEqual([
      "old", "yesterday", "today", "tomorrow", "two-days", "three-days",
    ]);
    expect(tasks[0].id).toBe("three-days");
  });

  it("excludes completed tasks and tasks already reminded on the local date", () => {
    expect(selectTasksToRemind([
      task("completed", "2026-10-01", "2026-10-30"),
      task("sent", today),
      task("new", today),
    ], today, ["sent"]).map((t) => t.id)).toEqual(["new"]);
  });

  it("handles empty input and an all-ineligible list", () => {
    expect(selectTasksToRemind([], today)).toEqual([]);
    expect(selectTasksToRemind([task("future", "2026-11-06")], today)).toEqual([]);
  });

  it("uses calendar days across month, year, leap-day, and DST boundaries", () => {
    for (const [start, cutoff, excluded] of [
      ["2026-12-30", "2027-01-02", "2027-01-03"],
      ["2028-02-27", "2028-03-01", "2028-03-02"],
      ["2026-03-07", "2026-03-10", "2026-03-11"],
    ]) {
      expect(selectTasksToRemind([task("included", cutoff), task("excluded", excluded)], start)
        .map((t) => t.id)).toEqual(["included"]);
    }
  });
});

describe("getReminderDay", () => {
  it("decides Monday using the recipient's local date, including opposite sides of midnight", () => {
    const now = new Date("2026-11-02T00:30:00Z");
    expect(getReminderDay("America/Los_Angeles", now)).toEqual({ today: "2026-11-01", isMonday: false });
    expect(getReminderDay("Asia/Tokyo", now)).toEqual({ today: "2026-11-02", isMonday: true });
  });

  it("does not treat local Tuesday as Monday just because UTC is Monday", () => {
    expect(getReminderDay("Pacific/Kiritimati", new Date("2026-11-02T13:00:00Z")))
      .toEqual({ today: "2026-11-03", isMonday: false });
  });

  it("uses the domain fallback for invalid time zones", () => {
    const now = new Date("2026-11-02T02:00:00Z");
    expect(getReminderDay("invalid", now)).toEqual(getReminderDay("America/New_York", now));
  });
});

describe("shouldSendWeeklySummary", () => {
  const monday = { today, isMonday: true };

  it("requires opt-in, local Monday, and no summary already recorded for today", () => {
    expect(shouldSendWeeklySummary({ weeklySummary: true, lastWeeklySummaryOn: null }, monday)).toBe(true);
    expect(shouldSendWeeklySummary({ weeklySummary: true, lastWeeklySummaryOn: "2026-10-26" }, monday)).toBe(true);
    expect(shouldSendWeeklySummary({ weeklySummary: true, lastWeeklySummaryOn: today }, monday)).toBe(false);
    expect(shouldSendWeeklySummary({ weeklySummary: false, lastWeeklySummaryOn: null }, monday)).toBe(false);
    expect(shouldSendWeeklySummary({ weeklySummary: true, lastWeeklySummaryOn: null }, {
      today: "2026-11-01", isMonday: false,
    })).toBe(false);
  });
});
