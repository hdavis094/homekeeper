import { describe, expect, it } from "vitest";
import { healthLabel, healthScore, homeStats, systemStatus } from "@/lib/domain/stats";

const today = "2026-03-06";
const open = (dueDate: string, itemId: string | null = null) => ({ dueDate, completedAt: null, itemId });

describe("homeStats", () => {
  const tasks = [
    open("2026-03-01"), // overdue
    open("2026-03-04"), // overdue
    open("2026-03-06"), // today → upcoming
    open("2026-03-20"), // upcoming
    open("2026-04-05"), // 30 days → upcoming
    open("2026-04-06"), // 31 days → not upcoming
    { dueDate: "2026-03-10", completedAt: "2026-03-02", itemId: null }, // completed, not upcoming
  ];
  const logEntries = [
    { date: "2026-03-01", costCents: 12_500 },
    { date: "2026-03-05", costCents: null },
    { date: "2026-03-06", costCents: 4_999 },
    { date: "2026-02-28", costCents: 10_000 },
    { date: "2026-01-15", costCents: 7_000 },
    { date: "2025-03-03", costCents: 1_000 }, // same month, last year
  ];

  it("counts open tasks due in the next 30 days, including today", () => {
    expect(homeStats({ tasks, logEntries, today }).upcoming).toBe(3);
  });

  it("counts overdue open tasks", () => {
    expect(homeStats({ tasks, logEntries, today }).overdue).toBe(2);
  });

  it("counts log entries this month and last month, with the delta", () => {
    const stats = homeStats({ tasks, logEntries, today });
    expect(stats.completedThisMonth).toBe(3);
    expect(stats.completedLastMonth).toBe(1);
    expect(stats.completedDelta).toBe(2);
  });

  it("sums this month's spend in cents, treating missing costs as 0", () => {
    expect(homeStats({ tasks, logEntries, today }).spentThisMonthCents).toBe(17_499);
  });

  it("handles January (last month is December of the previous year)", () => {
    const stats = homeStats({
      tasks: [],
      logEntries: [
        { date: "2025-12-31", costCents: 100 },
        { date: "2026-01-02", costCents: 200 },
      ],
      today: "2026-01-10",
    });
    expect(stats.completedThisMonth).toBe(1);
    expect(stats.completedLastMonth).toBe(1);
    expect(stats.completedDelta).toBe(0);
    expect(stats.spentThisMonthCents).toBe(200);
  });

  it("is all zeros for a new home", () => {
    expect(homeStats({ tasks: [], logEntries: [], today })).toEqual({
      upcoming: 0,
      overdue: 0,
      completedThisMonth: 0,
      completedLastMonth: 0,
      completedDelta: 0,
      spentThisMonthCents: 0,
    });
  });
});

describe("healthScore", () => {
  it("is 100 − 10 per overdue task − 5 per item needing service", () => {
    expect(healthScore({ overdue: 0, itemsNeedingService: 0 })).toBe(100);
    expect(healthScore({ overdue: 2, itemsNeedingService: 3 })).toBe(65);
    expect(healthScore({ overdue: 0, itemsNeedingService: 1 })).toBe(95);
  });

  it("is clamped to 0–100", () => {
    expect(healthScore({ overdue: 12, itemsNeedingService: 0 })).toBe(0);
  });
});

describe("healthLabel", () => {
  it.each([
    [100, "Looking good"],
    [85, "Looking good"],
    [84, "Needs some attention"],
    [60, "Needs some attention"],
    [59, "At risk"],
    [0, "At risk"],
  ])("%i → %s", (score, label) => {
    expect(healthLabel(score)).toBe(label);
  });
});

describe("systemStatus", () => {
  const items = [
    { id: "hvac-1", category: "hvac" as const, condition: "good" as const },
    { id: "roof-1", category: "roof" as const, condition: "needs_service" as const },
    { id: "wh", category: "plumbing" as const, condition: "good" as const },
    { id: "fridge", category: "kitchen" as const, condition: "needs_service" as const },
  ];

  it("returns HVAC, Roof, Plumbing and Electrical in that order with labels", () => {
    expect(systemStatus(items, [], today).map((s) => [s.system, s.label])).toEqual([
      ["hvac", "HVAC"],
      ["roof", "Roof"],
      ["plumbing", "Plumbing"],
      ["electrical", "Electrical"],
    ]);
  });

  it("is good when every item is good and no linked task is overdue (or there are no items)", () => {
    const status = systemStatus(items, [open("2026-03-20", "hvac-1")], today);
    expect(status.find((s) => s.system === "hvac")?.status).toBe("good");
    expect(status.find((s) => s.system === "electrical")?.status).toBe("good");
  });

  it("needs attention when any item in the category needs service", () => {
    const status = systemStatus(items, [], today);
    expect(status.find((s) => s.system === "roof")?.status).toBe("needs_attention");
  });

  it("needs attention when a task linked to an item in the category is overdue", () => {
    const status = systemStatus(items, [open("2026-03-04", "wh")], today);
    expect(status.find((s) => s.system === "plumbing")?.status).toBe("needs_attention");
  });

  it("ignores completed overdue-dated tasks and categories outside the four systems", () => {
    const status = systemStatus(
      items,
      [{ dueDate: "2026-03-01", completedAt: "2026-03-02", itemId: "wh" }],
      today,
    );
    expect(status.find((s) => s.system === "plumbing")?.status).toBe("good");
    expect(status).toHaveLength(4);
  });
});
