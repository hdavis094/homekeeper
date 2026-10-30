// Task server actions against DATABASE_URL_TEST. The session is mocked to a throwaway home;
// everything else (validation, Drizzle, batch writes) is real.
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { item, logEntry, task, vendor } from "@/lib/db/schema";
import { createTestHome, hasTestDb } from "../data/fixtures";

const TODAY = "2026-10-29";

const session = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/session", () => ({
  getCurrentHome: async () => {
    if (!session.current) throw new Error("No session");
    return session.current;
  },
}));
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

// Imported after the mocks are registered.
const { completeTask, createTask, deleteTask, logRepair, updateTask } = await import("@/lib/actions/tasks");

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

type TestHome = Awaited<ReturnType<typeof createTestHome>>;

describe.skipIf(!hasTestDb)("task actions", { timeout: 60_000 }, () => {
  let mine: TestHome;
  let theirs: TestHome;
  let furnaceId: string;
  let plumberId: string;
  let electricianId: string;
  let foreignItemId: string;

  function signInAs(h: TestHome) {
    session.current = { home: h.home, user: h.user, today: TODAY, timeZone: "America/New_York" };
  }

  async function insertTask(homeId: string, values: Partial<typeof task.$inferInsert> = {}) {
    const [row] = await db
      .insert(task)
      .values({ homeId, title: "Test task", dueDate: "2026-11-15", ...values })
      .returning();
    return row!;
  }

  beforeAll(async () => {
    mine = await createTestHome({ today: TODAY });
    theirs = await createTestHome({ today: TODAY });
    [{ id: furnaceId }] = await db
      .insert(item)
      .values({ homeId: mine.home.id, name: "Furnace", category: "hvac" })
      .returning({ id: item.id });
    [{ id: plumberId }, { id: electricianId }] = await db
      .insert(vendor)
      .values([
        { homeId: mine.home.id, name: "Joe's Plumbing", trade: "plumbing" },
        { homeId: mine.home.id, name: "Spark Electric", trade: "electrical" },
      ])
      .returning({ id: vendor.id });
    [{ id: foreignItemId }] = await db
      .insert(item)
      .values({ homeId: theirs.home.id, name: "Their Furnace", category: "hvac" })
      .returning({ id: item.id });
  });

  afterAll(async () => {
    await mine?.cleanup();
    await theirs?.cleanup();
  });

  beforeEach(() => {
    signInAs(mine);
    revalidatePath.mockClear();
  });

  describe("createTask", () => {
    it("creates a recurring task linked to an item and vendor", async () => {
      const result = await createTask(
        null,
        form({
          title: "  Replace HVAC Filter ",
          location: "Living Room",
          dueDate: "2026-11-01",
          recurrenceEvery: "3",
          recurrenceUnit: "month",
          itemId: furnaceId,
          vendorId: plumberId,
          notes: "",
        }),
      );
      expect(result).toMatchObject({ ok: true });
      const [row] = await db
        .select()
        .from(task)
        .where(and(eq(task.homeId, mine.home.id), eq(task.title, "Replace HVAC Filter")));
      expect(row).toMatchObject({
        location: "Living Room",
        dueDate: "2026-11-01",
        recurrence: { every: 3, unit: "month" },
        itemId: furnaceId,
        vendorId: plumberId,
        notes: null,
        completedAt: null,
      });
      for (const path of ["/tasks", "/home", "/schedule", "/inventory", "/vendors"]) {
        expect(revalidatePath).toHaveBeenCalledWith(path);
      }
    });

    it("returns field errors and writes nothing for invalid input", async () => {
      const result = await createTask(null, form({ title: "", dueDate: "2026-02-30", recurrenceUnit: "none" }));
      expect(result.ok).toBe(false);
      expect(result.fieldErrors).toMatchObject({ title: "Title is required", dueDate: "Enter a valid date" });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects an item from another home", async () => {
      const result = await createTask(
        null,
        form({ title: "Sneaky", dueDate: "2026-11-01", recurrenceUnit: "none", itemId: foreignItemId }),
      );
      expect(result).toMatchObject({ ok: false, fieldErrors: { itemId: expect.any(String) } });
      const rows = await db.select().from(task).where(eq(task.title, "Sneaky"));
      expect(rows).toHaveLength(0);
    });
  });

  describe("updateTask", () => {
    it("updates fields and can clear the recurrence", async () => {
      const t = await insertTask(mine.home.id, { recurrence: { every: 1, unit: "year" }, vendorId: plumberId });
      const result = await updateTask(
        null,
        form({ id: t.id, title: "Renamed", location: "Garage", dueDate: "2026-12-01", recurrenceUnit: "none" }),
      );
      expect(result).toMatchObject({ ok: true });
      const [row] = await db.select().from(task).where(eq(task.id, t.id));
      expect(row).toMatchObject({
        title: "Renamed",
        location: "Garage",
        dueDate: "2026-12-01",
        recurrence: null,
        vendorId: null,
      });
    });

    it("can't touch another home's task", async () => {
      const t = await insertTask(theirs.home.id, { title: "Theirs" });
      const result = await updateTask(
        null,
        form({ id: t.id, title: "Hijacked", dueDate: "2026-12-01", recurrenceUnit: "none" }),
      );
      expect(result).toMatchObject({ ok: false, formError: "Task not found" });
      const [row] = await db.select().from(task).where(eq(task.id, t.id));
      expect(row!.title).toBe("Theirs");
    });
  });

  describe("deleteTask", () => {
    it("deletes my task and keeps its log history", async () => {
      const t = await insertTask(mine.home.id);
      const [entry] = await db
        .insert(logEntry)
        .values({ homeId: mine.home.id, taskId: t.id, title: t.title, date: "2026-10-01" })
        .returning();
      expect(await deleteTask(t.id)).toMatchObject({ ok: true });
      expect(await db.select().from(task).where(eq(task.id, t.id))).toHaveLength(0);
      const [kept] = await db.select().from(logEntry).where(eq(logEntry.id, entry!.id));
      expect(kept).toMatchObject({ taskId: null, title: "Test task" });
    });

    it("leaves another home's task alone", async () => {
      const t = await insertTask(theirs.home.id);
      expect(await deleteTask(t.id)).toMatchObject({ ok: false, formError: "Task not found" });
      expect(await db.select().from(task).where(eq(task.id, t.id))).toHaveLength(1);
      expect(await deleteTask("not-a-uuid")).toMatchObject({ ok: false });
    });
  });

  describe("completeTask", () => {
    it("logs cost on a recurring task and moves its due date", async () => {
      const t = await insertTask(mine.home.id, {
        title: "Replace HVAC Filter",
        dueDate: "2026-10-26",
        recurrence: { every: 3, unit: "month" },
        itemId: furnaceId,
        vendorId: plumberId,
      });
      const result = await completeTask(
        null,
        form({
          taskId: t.id,
          date: TODAY,
          cost: "$125.50",
          receiptUrl: "https://abc.public.blob.vercel-storage.com/receipts/filter.pdf",
          notes: "Used MERV 11",
        }),
      );
      expect(result).toMatchObject({ ok: true });

      const [updated] = await db.select().from(task).where(eq(task.id, t.id));
      expect(updated).toMatchObject({ dueDate: "2027-01-26", completedAt: null });

      const entries = await db.select().from(logEntry).where(eq(logEntry.taskId, t.id));
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        homeId: mine.home.id,
        title: "Replace HVAC Filter",
        date: TODAY,
        costCents: 12550,
        itemId: furnaceId,
        vendorId: plumberId,
        receiptUrl: "https://abc.public.blob.vercel-storage.com/receipts/filter.pdf",
        notes: "Used MERV 11",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/schedule");
    });

    it("skips ahead past the completion date for a long-overdue recurring task", async () => {
      const t = await insertTask(mine.home.id, { dueDate: "2026-06-01", recurrence: { every: 1, unit: "month" } });
      await completeTask(null, form({ taskId: t.id, date: TODAY }));
      const [updated] = await db.select().from(task).where(eq(task.id, t.id));
      expect(updated!.dueDate).toBe("2026-11-01");
    });

    it("completes a one-off task, honours a vendor override, and refuses a second completion", async () => {
      const t = await insertTask(mine.home.id, { dueDate: "2026-10-20", vendorId: plumberId });
      const result = await completeTask(
        null,
        form({ taskId: t.id, date: "2026-10-28", cost: "80", vendorId: electricianId }),
      );
      expect(result).toMatchObject({ ok: true });
      const [updated] = await db.select().from(task).where(eq(task.id, t.id));
      expect(updated).toMatchObject({ dueDate: "2026-10-20", completedAt: "2026-10-28" });
      const [entry] = await db.select().from(logEntry).where(eq(logEntry.taskId, t.id));
      expect(entry).toMatchObject({ costCents: 8000, vendorId: electricianId });

      const again = await completeTask(null, form({ taskId: t.id, date: TODAY }));
      expect(again).toMatchObject({ ok: false, formError: "This task is already completed" });
      expect(await db.select().from(logEntry).where(eq(logEntry.taskId, t.id))).toHaveLength(1);
    });

    it("rejects bad input and other homes' tasks", async () => {
      const t = await insertTask(mine.home.id);
      const bad = await completeTask(null, form({ taskId: t.id, date: "", cost: "-5" }));
      expect(bad).toMatchObject({ ok: false, fieldErrors: { date: "Date is required", cost: expect.any(String) } });

      const foreign = await insertTask(theirs.home.id);
      const result = await completeTask(null, form({ taskId: foreign.id, date: TODAY }));
      expect(result).toMatchObject({ ok: false, formError: "Task not found" });
      expect(await db.select().from(logEntry).where(eq(logEntry.taskId, foreign.id))).toHaveLength(0);
    });
  });

  describe("logRepair", () => {
    it("creates a log entry with no task", async () => {
      const result = await logRepair(
        null,
        form({
          title: "Fix leaking faucet",
          date: "2026-10-27",
          cost: "1,250",
          vendorId: plumberId,
          itemId: furnaceId,
          notes: "Replaced cartridge",
        }),
      );
      expect(result).toMatchObject({ ok: true });
      const [entry] = await db
        .select()
        .from(logEntry)
        .where(and(eq(logEntry.homeId, mine.home.id), eq(logEntry.title, "Fix leaking faucet")));
      expect(entry).toMatchObject({
        taskId: null,
        date: "2026-10-27",
        costCents: 125000,
        vendorId: plumberId,
        itemId: furnaceId,
        receiptUrl: null,
        notes: "Replaced cartridge",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/vendors");
    });

    it("validates the title and rejects another home's item", async () => {
      const result = await logRepair(null, form({ title: "", date: TODAY, itemId: foreignItemId }));
      expect(result).toMatchObject({ ok: false, fieldErrors: { title: "Title is required" } });
      const foreign = await logRepair(null, form({ title: "Sneaky repair", date: TODAY, itemId: foreignItemId }));
      expect(foreign).toMatchObject({ ok: false, fieldErrors: { itemId: expect.any(String) } });
    });
  });
});
