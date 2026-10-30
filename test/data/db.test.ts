// Integration test against DATABASE_URL_TEST (a Neon branch with migrations applied:
// `DATABASE_URL=$DATABASE_URL_TEST npm run db:migrate`). Skipped when it isn't set.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { getItemFor, listItemOptionsFor, listItemsFor } from "@/lib/data/items";
import { listLogEntriesFor, getSpendThisMonthFor } from "@/lib/data/log";
import { getTasksToRemind, getWeeklySummary, listReminderRecipients, markReminderSent } from "@/lib/data/reminders";
import type { HomeScope } from "@/lib/data/scope";
import { getDashboardFor } from "@/lib/data/stats";
import {
  getTaskFor,
  listCalendarEntriesFor,
  listTasksFor,
  listUpcomingTasksFor,
} from "@/lib/data/tasks";
import { getVendorFor, listVendorOptionsFor, listVendorsFor } from "@/lib/data/vendors";
import { db } from "@/lib/db";
import { home, item, logEntry, task, user, vendor } from "@/lib/db/schema";
import { seedDemo } from "@/lib/db/seed";
import { DEMO_USER } from "@/lib/db/seed-data";
import { addDays, monthRange } from "@/lib/domain/dates";
import { createTestHome, hasTestDb, signInHeaders } from "./fixtures";

const TODAY = "2026-10-29";

describe.skipIf(!hasTestDb)("data layer on the seeded demo home", { timeout: 60_000 }, () => {
  let scope: HomeScope;
  let other: Awaited<ReturnType<typeof createTestHome>>;

  beforeAll(async () => {
    await seedDemo({ today: TODAY });
    // Sign in as the seed user the way the app does, and resolve their home from the session.
    const headers = await signInHeaders(DEMO_USER.email, DEMO_USER.password);
    const session = await auth.api.getSession({ headers });
    expect(session?.user.email).toBe(DEMO_USER.email);
    expect(session?.user.timeZone).toBe("America/New_York");
    const [row] = await db.select().from(home).where(eq(home.userId, session!.user.id));
    scope = { homeId: row!.id, today: TODAY };
    other = await createTestHome({ today: TODAY });
  });

  afterAll(async () => {
    await other?.cleanup();
  });

  it("seeding twice still leaves exactly one demo user", async () => {
    await seedDemo({ today: TODAY });
    const users = await db.select().from(user).where(eq(user.email, DEMO_USER.email));
    expect(users).toHaveLength(1);
    const [row] = await db.select().from(home).where(eq(home.userId, users[0]!.id));
    scope = { homeId: row!.id, today: TODAY };
  });

  it("lists the seed tasks with counts per status", async () => {
    const { tasks, counts } = await listTasksFor(scope);
    expect(counts).toEqual({ all: 12, overdue: 2, due_soon: 3, scheduled: 5, completed: 2 });
    expect(tasks[0]).toMatchObject({ title: "Inspect Sump Pump", status: "overdue", dueText: "Overdue by 5 days" });
    expect(tasks.find((t) => t.title === "Service Water Softener")).toMatchObject({
      itemName: "Water Softener",
      vendorName: "Mike's Plumbing Co.",
      recurrence: { every: 1, unit: "year" },
    });
  });

  it("filters tasks by status and search", async () => {
    const overdue = await listTasksFor(scope, { status: "overdue" });
    expect(overdue.tasks.map((t) => t.title)).toEqual(["Inspect Sump Pump", "Flush Water Heater"]);
    const search = await listTasksFor(scope, { q: "basement" });
    expect(search.counts.all).toBe(4);
    const searchOverdue = await listTasksFor(scope, { q: "filter", status: "due_soon" });
    expect(searchOverdue.tasks.map((t) => t.title)).toEqual(["Replace HVAC Filter", "Clean Range Hood Filter"]);
    expect((await listTasksFor(scope, { q: "100%_off" })).counts.all).toBe(0);
  });

  it("gets one task, and never another home's", async () => {
    const { tasks } = await listTasksFor(scope);
    const first = tasks[0]!;
    expect((await getTaskFor(scope, first.id))?.title).toBe(first.title);
    expect(await getTaskFor(other.scope, first.id)).toBeNull();
    expect((await listTasksFor(other.scope)).counts.all).toBe(0);
  });

  it("lists the 5 upcoming open tasks, overdue first", async () => {
    const upcoming = await listUpcomingTasksFor(scope);
    expect(upcoming.map((t) => t.status)).toEqual(["overdue", "overdue", "due_soon", "due_soon", "due_soon"]);
  });

  it("returns calendar entries for a month, including completions", async () => {
    const { start, end } = monthRange(TODAY);
    const entries = await listCalendarEntriesFor(scope, start, end);
    expect(entries.find((e) => e.title === "Flush Water Heater")).toMatchObject({
      kind: "task",
      date: addDays(TODAY, -2),
      status: "overdue",
    });
    const lastMonth = monthRange(addDays(start, -1));
    const done = await listCalendarEntriesFor(scope, lastMonth.start, lastMonth.end);
    expect(done.filter((e) => e.kind === "completion").map((e) => e.title).sort()).toEqual([
      "Replace Furnace Igniter",
      "Winterize Sprinkler System",
    ]);
  });

  it("lists items with category counts and item detail with history", async () => {
    const { items, counts } = await listItemsFor(scope);
    expect(items).toHaveLength(9);
    expect(counts).toMatchObject({ all: 9, plumbing: 3, laundry: 2, exterior: 0 });
    expect((await listItemsFor(scope, { category: "plumbing" })).items.map((i) => i.name)).toEqual([
      "Sump Pump",
      "Water Heater",
      "Water Softener",
    ]);
    const hvac = items.find((i) => i.name === "HVAC System")!;
    const detail = await getItemFor(scope, hvac.id);
    expect(detail?.tasks.map((t) => t.title)).toEqual(["Replace HVAC Filter", "Replace Furnace Igniter"]);
    expect(detail?.log.map((e) => e.title)).toEqual(["Replace Furnace Igniter"]);
    expect(detail?.totalCostCents).toBe(24_500);
    expect(await getItemFor(other.scope, hvac.id)).toBeNull();
    expect(await listItemOptionsFor(scope)).toHaveLength(9);
  });

  it("lists vendors with last hired from the log", async () => {
    const { vendors, counts } = await listVendorsFor(scope);
    expect(counts).toEqual({ all: 9, plumbing: 1, electrical: 1, hvac: 1, landscaping: 1, general: 5 });
    expect(vendors.find((v) => v.name === "CoolBreeze HVAC")).toMatchObject({
      rating: 4.7,
      lastHiredText: "Last hired: Sep 2026",
    });
    expect((await listVendorsFor(scope, { q: "spark" })).vendors.map((v) => v.name)).toEqual(["BrightSpark Electric"]);
    expect((await listVendorsFor(scope, { trade: "general" })).vendors).toHaveLength(5);
    const mike = vendors.find((v) => v.name === "Mike's Plumbing Co.")!;
    const detail = await getVendorFor(scope, mike.id);
    expect(detail?.log).toHaveLength(2);
    expect(detail?.totalSpentCents).toBe(39_500);
    expect(await listVendorOptionsFor(scope)).toHaveLength(9);
  });

  it("lists log entries and this month's spend", async () => {
    const log = await listLogEntriesFor(scope, { limit: 3 });
    expect(log).toHaveLength(3);
    expect(log[0]!.date >= log[1]!.date).toBe(true);
    expect(await getSpendThisMonthFor(scope)).toBe(9_500 + 1_800 + 4_200 + 2_750);
  });

  it("computes the dashboard", async () => {
    const dashboard = await getDashboardFor(scope);
    expect(dashboard.stats).toMatchObject({ overdue: 2, completedThisMonth: 4, completedLastMonth: 2 });
    expect(dashboard.health).toEqual({ score: 65, label: "Needs some attention" });
    expect(dashboard.systems.map((s) => s.status)).toEqual(["good", "needs_attention", "needs_attention", "good"]);
  });

  it("selects reminders once per task per day", async () => {
    const recipients = await listReminderRecipients();
    expect(recipients.find((r) => r.homeId === scope.homeId)).toMatchObject({
      email: DEMO_USER.email,
      timeZone: "America/New_York",
      emailReminders: true,
    });
    const due = await getTasksToRemind(scope.homeId, TODAY);
    expect(due.map((t) => t.title)).toEqual(["Inspect Sump Pump", "Flush Water Heater", "Replace HVAC Filter"]);
    await markReminderSent(
      due.map((t) => t.id),
      TODAY,
    );
    await markReminderSent(
      due.map((t) => t.id),
      TODAY,
    );
    expect(await getTasksToRemind(scope.homeId, TODAY)).toEqual([]);
    // Tomorrow is a new day: already-reminded tasks come back, plus newly due-soon ones.
    expect(await getTasksToRemind(scope.homeId, addDays(TODAY, 1))).toHaveLength(4);
    const summary = await getWeeklySummary(scope.homeId, TODAY);
    expect(summary.overdue).toHaveLength(2);
    expect(summary.upcoming.map((t) => t.title)).toEqual([
      "Replace HVAC Filter",
      "Clean Range Hood Filter",
      "Check Fire Extinguisher",
    ]);
  });

  it("deleting a user cascades to their home and all its data", async () => {
    const temp = await createTestHome({ today: TODAY });
    const [i] = await db
      .insert(item)
      .values({ homeId: temp.home.id, name: "Boiler", category: "hvac" })
      .returning();
    const [v] = await db
      .insert(vendor)
      .values({ homeId: temp.home.id, name: "Pat", trade: "general" })
      .returning();
    const [t] = await db
      .insert(task)
      .values({ homeId: temp.home.id, title: "Bleed radiators", dueDate: TODAY, itemId: i!.id })
      .returning();
    await db.insert(logEntry).values({ homeId: temp.home.id, taskId: t!.id, vendorId: v!.id, title: "Bled", date: TODAY });
    await temp.cleanup();
    expect(await db.select().from(home).where(eq(home.id, temp.home.id))).toEqual([]);
    expect(await db.select().from(task).where(eq(task.homeId, temp.home.id))).toEqual([]);
    expect(await db.select().from(logEntry).where(eq(logEntry.homeId, temp.home.id))).toEqual([]);
  });
});
