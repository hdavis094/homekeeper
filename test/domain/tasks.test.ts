import { describe, expect, it } from "vitest";
import {
  dueText,
  nextDueDate,
  recurrenceText,
  sortTasks,
  taskStatus,
} from "@/lib/domain/tasks";

const today = "2026-03-06";
const open = (dueDate: string) => ({ dueDate, completedAt: null });

describe("taskStatus", () => {
  it("is overdue when the due date is before today", () => {
    expect(taskStatus(open("2026-03-05"), today)).toBe("overdue");
    expect(taskStatus(open("2025-12-01"), today)).toBe("overdue");
  });

  it("is due soon from today through 7 days out", () => {
    expect(taskStatus(open("2026-03-06"), today)).toBe("due_soon");
    expect(taskStatus(open("2026-03-09"), today)).toBe("due_soon");
    expect(taskStatus(open("2026-03-13"), today)).toBe("due_soon");
  });

  it("is scheduled more than 7 days out", () => {
    expect(taskStatus(open("2026-03-14"), today)).toBe("scheduled");
    expect(taskStatus(open("2026-06-01"), today)).toBe("scheduled");
  });

  it("is completed when completedAt is set, regardless of due date", () => {
    expect(taskStatus({ dueDate: "2026-01-01", completedAt: "2026-01-02" }, today)).toBe("completed");
    expect(taskStatus({ dueDate: "2026-04-01", completedAt: "2026-03-01" }, today)).toBe("completed");
  });
});

describe("dueText", () => {
  it.each([
    ["2026-03-04", "Overdue by 2 days"],
    ["2026-03-05", "Overdue by 1 day"],
    ["2026-03-01", "Overdue by 5 days"],
    ["2026-02-20", "Overdue by 2 weeks"],
    ["2026-03-06", "Due today"],
    ["2026-03-07", "Due tomorrow"],
    ["2026-03-09", "Due in 3 days"],
    ["2026-03-12", "Due in 6 days"],
    ["2026-03-13", "Due in 1 week"],
    ["2026-03-14", "Due in 1 week"],
    ["2026-03-20", "Due in 2 weeks"],
    ["2026-03-27", "Due in 3 weeks"],
    ["2026-04-10", "Due in 5 weeks"],
    ["2026-04-17", "Due in 6 weeks"],
    ["2026-05-15", "Due in 2 months"],
    ["2027-03-06", "Due in 1 year"],
  ])("due %s → %s", (dueDate, text) => {
    expect(dueText(open(dueDate), today)).toBe(text);
  });

  it("shows the completion date for completed tasks", () => {
    expect(dueText({ dueDate: "2025-09-28", completedAt: "2026-02-28" }, today)).toBe("Completed Feb 28");
  });

  it("adds the year when the completion was in another year", () => {
    expect(dueText({ dueDate: "2025-09-28", completedAt: "2025-09-28" }, today)).toBe(
      "Completed Sep 28, 2025",
    );
  });
});

describe("nextDueDate", () => {
  it("adds days, weeks, months and years", () => {
    expect(nextDueDate("2026-03-06", { every: 10, unit: "day" })).toBe("2026-03-16");
    expect(nextDueDate("2026-03-06", { every: 2, unit: "week" })).toBe("2026-03-20");
    expect(nextDueDate("2026-03-06", { every: 3, unit: "month" })).toBe("2026-06-06");
    expect(nextDueDate("2026-03-06", { every: 1, unit: "year" })).toBe("2027-03-06");
  });

  it("clamps month-end dates", () => {
    expect(nextDueDate("2026-01-31", { every: 1, unit: "month" })).toBe("2026-02-28");
    expect(nextDueDate("2028-02-29", { every: 1, unit: "year" })).toBe("2029-02-28");
  });

  it("keeps the original day when stepping repeatedly past short months", () => {
    // Jan 31 → (Feb 28) → Mar 31, not Mar 28.
    expect(nextDueDate("2026-01-31", { every: 1, unit: "month" }, "2026-03-01")).toBe("2026-03-31");
  });

  it("keeps stepping until the result is after `after`", () => {
    expect(nextDueDate("2026-01-01", { every: 1, unit: "month" }, "2026-03-06")).toBe("2026-04-01");
    expect(nextDueDate("2026-03-01", { every: 1, unit: "week" }, "2026-03-08")).toBe("2026-03-15");
  });

  it("returns a single step when `after` is already behind it", () => {
    expect(nextDueDate("2026-03-10", { every: 1, unit: "week" }, "2026-03-06")).toBe("2026-03-17");
  });
});

describe("recurrenceText", () => {
  it("describes the recurrence", () => {
    expect(recurrenceText(null)).toBe("Does not repeat");
    expect(recurrenceText({ every: 1, unit: "day" })).toBe("Every day");
    expect(recurrenceText({ every: 1, unit: "year" })).toBe("Every year");
    expect(recurrenceText({ every: 3, unit: "month" })).toBe("Every 3 months");
    expect(recurrenceText({ every: 2, unit: "week" })).toBe("Every 2 weeks");
  });
});

describe("sortTasks", () => {
  it("orders overdue → due soon → scheduled → completed, by date within a group", () => {
    const tasks = [
      { id: "scheduled-late", dueDate: "2026-04-17", completedAt: null },
      { id: "completed-old", dueDate: "2025-01-01", completedAt: "2025-09-20" },
      { id: "due-soon", dueDate: "2026-03-09", completedAt: null },
      { id: "overdue-5", dueDate: "2026-03-01", completedAt: null },
      { id: "completed-new", dueDate: "2025-01-01", completedAt: "2025-09-28" },
      { id: "overdue-2", dueDate: "2026-03-04", completedAt: null },
      { id: "scheduled-early", dueDate: "2026-03-14", completedAt: null },
    ];
    expect(sortTasks(tasks, today).map((t) => t.id)).toEqual([
      "overdue-5",
      "overdue-2",
      "due-soon",
      "scheduled-early",
      "scheduled-late",
      "completed-new",
      "completed-old",
    ]);
  });

  it("does not mutate its input", () => {
    const tasks = [open("2026-04-01"), open("2026-03-01")];
    sortTasks(tasks, today);
    expect(tasks[0].dueDate).toBe("2026-04-01");
  });
});
