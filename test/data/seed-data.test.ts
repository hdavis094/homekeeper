import { describe, expect, it } from "vitest";
import { buildSeedData, DEMO_USER } from "@/lib/db/seed-data";
import { addMonths, formatMonthYear } from "@/lib/domain/dates";
import { healthScore, homeStats, systemStatus } from "@/lib/domain/stats";
import { dueText, taskStatus } from "@/lib/domain/tasks";

// Run against several "today"s: month starts/ends are where relative dates usually break.
const TODAYS = ["2026-10-29", "2026-03-06", "2026-03-01", "2026-01-01", "2026-12-31", "2028-02-29"];

describe("demo user", () => {
  it("is Alex Morgan with the demo password, on Eastern time", () => {
    expect(DEMO_USER).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@email.com",
      password: "homekeeper-demo",
      phone: "(555) 123-4567",
      timeZone: "America/New_York",
    });
  });
});

describe.each(TODAYS)("buildSeedData(%s)", (today) => {
  const data = buildSeedData(today);

  it("has the home from the Settings design", () => {
    expect(data.home).toEqual({
      address: "123 Maple St, Springfield",
      homeType: "single_family",
      yearBuilt: 1998,
      squareFeet: 2400,
      emailReminders: true,
      weeklySummary: false,
    });
  });

  it("has the 12 tasks from tasks.png with their statuses and due text", () => {
    const rows = data.tasks.map((t) => [t.title, t.location, taskStatus(t, today), dueText(t, today)]);
    expect(rows.slice(0, 10)).toEqual([
      ["Flush Water Heater", "Basement", "overdue", "Overdue by 2 days"],
      ["Inspect Sump Pump", "Basement", "overdue", "Overdue by 5 days"],
      ["Replace HVAC Filter", "Living Room", "due_soon", "Due in 3 days"],
      ["Clean Range Hood Filter", "Kitchen", "due_soon", "Due in 4 days"],
      ["Check Fire Extinguisher", "Garage", "due_soon", "Due in 6 days"],
      ["Clean Gutters", "Exterior", "scheduled", "Due in 1 week"],
      ["Test Smoke Detectors", "Whole Home", "scheduled", "Due in 2 weeks"],
      ["Clean Dryer Vent", "Laundry Room", "scheduled", "Due in 3 weeks"],
      ["Service Water Softener", "Basement", "scheduled", "Due in 5 weeks"],
      ["Pressure Wash Driveway", "Exterior", "scheduled", "Due in 6 weeks"],
    ]);
    expect(rows.slice(10).map((r) => r.slice(0, 3))).toEqual([
      ["Winterize Sprinkler System", "Yard", "completed"],
      ["Replace Furnace Igniter", "Basement", "completed"],
    ]);
  });

  it("only completes one-off tasks, each with a log entry and cost", () => {
    for (const t of data.tasks.filter((t) => t.completedAt)) {
      expect(t.recurrence).toBeNull();
      const entry = data.log.find((e) => e.taskTitle === t.title);
      expect(entry?.date).toBe(t.completedAt);
      expect(entry?.costCents).toBeGreaterThan(0);
    }
  });

  it("links tasks to items and vendors that exist", () => {
    const items = new Set(data.items.map((i) => i.name));
    const vendors = new Set(data.vendors.map((v) => v.name));
    for (const t of data.tasks) {
      if (t.itemName) expect(items).toContain(t.itemName);
      if (t.vendorName) expect(vendors).toContain(t.vendorName);
    }
    for (const e of data.log) {
      if (e.itemName) expect(items).toContain(e.itemName);
      if (e.vendorName) expect(vendors).toContain(e.vendorName);
    }
  });

  it("has the 9 items from inventory.png", () => {
    expect(data.items.map((i) => [i.name, i.model, i.installedYear, i.condition])).toEqual([
      ["HVAC System", "Carrier Infinity 24", 2019, "good"],
      ["Water Heater", "Rheem Performance Platinum", 2021, "needs_service"],
      ["Refrigerator", "LG French Door", 2020, "good"],
      ["Washer", "Samsung Front Load", 2022, "good"],
      ["Dryer", "Samsung Front Load", 2022, "good"],
      ["Roof", "Asphalt Shingle", 2015, "needs_service"],
      ["Water Softener", "Culligan Gen 2", 2020, "good"],
      ["Sump Pump", "Zoeller M53", 2018, "needs_service"],
      ["Smoke Detectors (x6)", "First Alert", 2023, "good"],
    ]);
  });

  it("has the 9 vendors from vendors.png, last hired the design's number of months ago", () => {
    // Design "today" is Mar 2026; last-hired months are kept relative to it.
    const monthsAgo: Record<string, number> = {
      "Mike's Plumbing Co.": 2,
      "BrightSpark Electric": 4,
      "CoolBreeze HVAC": 1,
      "GreenScape Landscaping": 5,
      "Reliable Roofing Co.": 9,
      "Precision Pest Control": 0,
      "ClearView Window Cleaning": 6,
      "Apex Appliance Repair": 3,
      "Northside Chimney Sweep": 7,
    };
    expect(data.vendors.map((v) => [v.name, v.trade, v.rating, v.phone])).toEqual([
      ["Mike's Plumbing Co.", "plumbing", 4.9, "(555) 212-3344"],
      ["BrightSpark Electric", "electrical", 4.8, "(555) 998-2211"],
      ["CoolBreeze HVAC", "hvac", 4.7, "(555) 334-7765"],
      ["GreenScape Landscaping", "landscaping", 4.6, "(555) 887-1123"],
      ["Reliable Roofing Co.", "general", 4.9, "(555) 442-9087"],
      ["Precision Pest Control", "general", 4.5, "(555) 665-3321"],
      ["ClearView Window Cleaning", "general", 4.8, "(555) 221-6654"],
      ["Apex Appliance Repair", "general", 4.7, "(555) 778-0099"],
      ["Northside Chimney Sweep", "general", 4.6, "(555) 556-4432"],
    ]);
    for (const v of data.vendors) {
      const last = data.log
        .filter((e) => e.vendorName === v.name)
        .map((e) => e.date)
        .sort()
        .at(-1);
      expect(last && formatMonthYear(last)).toBe(formatMonthYear(addMonths(today, -monthsAgo[v.name]!)));
    }
  });

  it("dates every log entry on or before today", () => {
    for (const e of data.log) expect(e.date <= today).toBe(true);
  });

  it("gives the dashboard a positive month-over-month delta and spend this month", () => {
    const stats = homeStats({ tasks: data.tasks, logEntries: data.log, today });
    expect(stats.overdue).toBe(2);
    expect(stats.completedDelta).toBeGreaterThan(0);
    expect(stats.spentThisMonthCents).toBeGreaterThan(0);
  });

  it("shows Plumbing and Roof needing attention, HVAC and Electrical good", () => {
    const items = data.items.map((i) => ({ ...i, id: i.name }));
    const tasks = data.tasks.map((t) => ({ ...t, itemId: t.itemName }));
    expect(Object.fromEntries(systemStatus(items, tasks, today).map((s) => [s.system, s.status]))).toEqual({
      hvac: "good",
      roof: "needs_attention",
      plumbing: "needs_attention",
      electrical: "good",
    });
    expect(
      healthScore({ overdue: 2, itemsNeedingService: data.items.filter((i) => i.condition !== "good").length }),
    ).toBe(65);
  });
});
