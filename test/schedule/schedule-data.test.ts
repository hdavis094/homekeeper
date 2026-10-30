import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildMonthMatrix,
  chipLabel,
  groupEntriesByDay,
  monthDateRange,
  nextMonthParam,
  parseMonthParam,
  prevMonthParam,
} from "@/app/ui/schedule/calendar";
import { listCalendarEntriesFor } from "@/lib/data/tasks";
import { db } from "@/lib/db";
import { logEntry, task } from "@/lib/db/schema";
import { createTestHome, hasTestDb } from "../data/fixtures";

describe.skipIf(!hasTestDb)("schedule calendar entries integration", () => {
  let ctx: Awaited<ReturnType<typeof createTestHome>>;

  beforeAll(async () => {
    ctx = await createTestHome({ today: "2026-03-06" });

    const [overdueTask, dueSoonTask, scheduledTask, completedTask] = await db
      .insert(task)
      .values([
        {
          homeId: ctx.home.id,
          title: "Inspect Sump Pump",
          location: "Basement",
          dueDate: "2026-03-02",
        },
        {
          homeId: ctx.home.id,
          title: "Replace HVAC Filter",
          location: "Living Room",
          dueDate: "2026-03-09",
        },
        {
          homeId: ctx.home.id,
          title: "Clean Gutters",
          location: "Exterior",
          dueDate: "2026-03-14",
        },
        {
          homeId: ctx.home.id,
          title: "Replace Furnace Igniter",
          location: "Basement",
          dueDate: "2026-03-20",
          completedAt: "2026-03-20",
        },
      ])
      .returning();

    await db.insert(logEntry).values({
      homeId: ctx.home.id,
      taskId: completedTask!.id,
      title: "Replace Furnace Igniter",
      date: "2026-03-20",
      costCents: 24500,
    });

    expect(overdueTask).toBeDefined();
    expect(dueSoonTask).toBeDefined();
    expect(scheduledTask).toBeDefined();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("queries open tasks and completed log entries for the month and places them in the grid", async () => {
    const { monthParam } = parseMonthParam(undefined, ctx.scope.today);
    expect(monthParam).toBe("2026-03");

    const { from, to } = monthDateRange(monthParam);
    const entries = await listCalendarEntriesFor(ctx.scope, from, to);

    expect(entries).toHaveLength(4);
    expect(entries.map((e) => ({ date: e.date, status: e.status, label: chipLabel(e) }))).toEqual([
      {
        date: "2026-03-02",
        status: "overdue",
        label: "Overdue: Inspect Sump Pump",
      },
      {
        date: "2026-03-09",
        status: "due_soon",
        label: "Replace HVAC Filter",
      },
      {
        date: "2026-03-14",
        status: "scheduled",
        label: "Clean Gutters",
      },
      {
        date: "2026-03-20",
        status: "completed",
        label: "Replace Furnace Igniter",
      },
    ]);

    const weeks = buildMonthMatrix(monthParam);
    expect(weeks).toHaveLength(5);

    const groups = groupEntriesByDay(entries);
    expect(groups.map((g) => g.date)).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-14",
      "2026-03-20",
    ]);

    expect(prevMonthParam(monthParam)).toBe("2026-02");
    expect(nextMonthParam(monthParam)).toBe("2026-04");
  });
});
