import { describe, expect, it } from "vitest";
import { getDashboardFor } from "@/lib/data/stats";
import { listUpcomingTasksFor } from "@/lib/data/tasks";
import { listItemOptionsFor } from "@/lib/data/items";
import { seedDemo } from "@/lib/db/seed";
import { buildSeedData, DEMO_USER } from "@/lib/db/seed-data";
import { healthLabel, healthScore, homeStats, systemStatus } from "@/lib/domain/stats";
import { dueText, sortTasks, taskStatus } from "@/lib/domain/tasks";
import {
  buildHomeViewModel,
  firstName,
  formatCompletedSublabel,
  formatTaskMeta,
  QUICK_ACTIONS,
} from "@/app/ui/home/view-model";
import { createTestHome, hasTestDb } from "../data/fixtures";

const TODAY = "2026-10-29";

describe("Home dashboard view-model helpers (pure)", () => {
  it("extracts the first name for the greeting", () => {
    expect(firstName("Alex Morgan")).toBe("Alex");
    expect(firstName("  Sam  ")).toBe("Sam");
    expect(firstName("")).toBe("there");
    expect(firstName(null)).toBe("there");
  });

  it("formats Completed This Month sublabel with signed delta and USD spend", () => {
    expect(
      formatCompletedSublabel({ completedDelta: 2, spentThisMonthCents: 18_250 }),
    ).toBe("+2 vs last month · $182.50 spent");
    expect(
      formatCompletedSublabel({ completedDelta: 0, spentThisMonthCents: 0 }),
    ).toBe("+0 vs last month · $0.00 spent");
    expect(
      formatCompletedSublabel({ completedDelta: -3, spentThisMonthCents: 28_500 }),
    ).toBe("-3 vs last month · $285.00 spent");
  });

  it("formats task row meta as 'location • due text' or falls back to due text", () => {
    expect(
      formatTaskMeta({ location: "Basement", dueText: "Overdue by 2 days" }),
    ).toBe("Basement • Overdue by 2 days");
    expect(
      formatTaskMeta({ location: null, dueText: "Due in 1 week" }),
    ).toBe("Due in 1 week");
  });

  it("matches homeStats, healthScore, systemStatus, and top 5 tasks on seed data", () => {
    const seed = buildSeedData(TODAY);
    const items = seed.items.map((item, idx) => ({
      id: `item-${idx}`,
      category: item.category,
      condition: item.condition,
      name: item.name,
    }));
    const itemIdByName = new Map(items.map((i) => [i.name, i.id]));
    const tasksWithIds = seed.tasks.map((t, idx) => ({
      id: `task-${idx + 1}`,
      homeId: "home-1",
      title: t.title,
      location: t.location,
      dueDate: t.dueDate,
      recurrence: t.recurrence,
      completedAt: t.completedAt,
      lastReminderSentOn: null,
      itemId: t.itemName ? (itemIdByName.get(t.itemName) ?? null) : null,
      vendorId: null,
      notes: t.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: taskStatus(t, TODAY),
      dueText: dueText(t, TODAY),
      itemName: t.itemName,
      vendorName: t.vendorName,
    }));

    const stats = homeStats({
      tasks: tasksWithIds,
      logEntries: seed.log,
      today: TODAY,
    });
    const score = healthScore({
      overdue: stats.overdue,
      itemsNeedingService: items.filter((i) => i.condition === "needs_service").length,
    });
    const systems = systemStatus(items, tasksWithIds, TODAY);
    const upcomingTasks = sortTasks(
      tasksWithIds.filter((t) => !t.completedAt),
      TODAY,
    ).slice(0, 5);

    const vm = buildHomeViewModel({
      userName: DEMO_USER.name,
      dashboard: {
        stats,
        health: { score, label: healthLabel(score) },
        systems,
      },
      upcomingTasks,
      itemCount: items.length,
    });

    expect(vm.greeting).toEqual({
      title: "Welcome back, Alex",
      subtitle: "Here's what's happening with your home today.",
    });

    expect(vm.statCards).toEqual([
      {
        id: "upcoming",
        label: "Upcoming Tasks",
        value: "6",
        sublabel: "Next 30 days",
        tone: "ink",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: "2",
        sublabel: "Needs attention",
        tone: "overdue",
      },
      {
        id: "completed",
        label: "Completed This Month",
        value: "4",
        sublabel: "+2 vs last month · $182.50 spent",
        tone: "completed",
      },
      {
        id: "health",
        label: "Home Health Score",
        value: "65%",
        sublabel: "Needs some attention",
        tone: "primary",
      },
    ]);

    expect(vm.upcomingMaintenance).toHaveLength(5);
    expect(vm.upcomingMaintenance.map((r) => [r.title, r.meta, r.status])).toEqual([
      ["Inspect Sump Pump", "Basement • Overdue by 5 days", "overdue"],
      ["Flush Water Heater", "Basement • Overdue by 2 days", "overdue"],
      ["Replace HVAC Filter", "Living Room • Due in 3 days", "due_soon"],
      ["Clean Range Hood Filter", "Kitchen • Due in 4 days", "due_soon"],
      ["Check Fire Extinguisher", "Garage • Due in 6 days", "due_soon"],
    ]);

    expect(vm.systems).toEqual([
      { system: "hvac", label: "HVAC", status: "good", pillLabel: "Good" },
      { system: "roof", label: "Roof", status: "needs_attention", pillLabel: "Needs Attention" },
      { system: "plumbing", label: "Plumbing", status: "needs_attention", pillLabel: "Needs Attention" },
      { system: "electrical", label: "Electrical", status: "good", pillLabel: "Good" },
    ]);

    expect(vm.quickActions).toEqual(QUICK_ACTIONS);
    expect(vm.isEmpty).toEqual({ tasks: false, items: false });
  });

  it("flags empty states for a brand-new user with no tasks or items", () => {
    const stats = homeStats({ tasks: [], logEntries: [], today: TODAY });
    const score = healthScore({ overdue: 0, itemsNeedingService: 0 });
    const vm = buildHomeViewModel({
      userName: "Jordan Lee",
      dashboard: {
        stats,
        health: { score, label: healthLabel(score) },
        systems: systemStatus([], [], TODAY),
      },
      upcomingTasks: [],
      itemCount: 0,
    });

    expect(vm.greeting.title).toBe("Welcome back, Jordan");
    expect(vm.statCards.map((c) => c.value)).toEqual(["0", "0", "0", "100%"]);
    expect(vm.statCards[3]?.sublabel).toBe("Looking good");
    expect(vm.upcomingMaintenance).toEqual([]);
    expect(vm.isEmpty).toEqual({ tasks: true, items: true });
  });
});

describe.skipIf(!hasTestDb)("Home dashboard view-model against PGlite DB", { timeout: 60_000 }, () => {
  it("builds the seeded demo user's dashboard view-model and a fresh user's empty view-model", async () => {
    const seeded = await seedDemo({ today: TODAY });
    const scope = { homeId: seeded.homeId, today: TODAY };
    const [dashboard, upcomingTasks, itemOpts] = await Promise.all([
      getDashboardFor(scope),
      listUpcomingTasksFor(scope, 5),
      listItemOptionsFor(scope),
    ]);

    const vm = buildHomeViewModel({
      userName: DEMO_USER.name,
      dashboard,
      upcomingTasks,
      itemCount: itemOpts.length,
    });

    expect(vm.statCards.map((c) => [c.label, c.value, c.sublabel])).toEqual([
      ["Upcoming Tasks", "6", "Next 30 days"],
      ["Overdue", "2", "Needs attention"],
      ["Completed This Month", "4", "+2 vs last month · $182.50 spent"],
      ["Home Health Score", "65%", "Needs some attention"],
    ]);
    expect(vm.upcomingMaintenance).toHaveLength(5);
    expect(vm.isEmpty).toEqual({ tasks: false, items: false });

    const fresh = await createTestHome({ today: TODAY });
    try {
      const [freshDash, freshTasks, freshItems] = await Promise.all([
        getDashboardFor(fresh.scope),
        listUpcomingTasksFor(fresh.scope, 5),
        listItemOptionsFor(fresh.scope),
      ]);
      const freshVm = buildHomeViewModel({
        userName: fresh.user.name,
        dashboard: freshDash,
        upcomingTasks: freshTasks,
        itemCount: freshItems.length,
      });
      expect(freshVm.isEmpty).toEqual({ tasks: true, items: true });
      expect(freshVm.statCards.map((c) => c.value)).toEqual(["0", "0", "0", "100%"]);
    } finally {
      await fresh.cleanup();
    }
  });
});
