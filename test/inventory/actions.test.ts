import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestHome, hasTestDb } from "../data/fixtures";
import { db } from "@/lib/db";
import { item } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

vi.mock("@/lib/session", () => ({ getCurrentHome: vi.fn() }));

import { getCurrentHome } from "@/lib/session";
import { createItem, updateItem, deleteItem } from "@/lib/actions/inventory";

describe.skipIf(!hasTestDb)("inventory actions", () => {
  let home: Awaited<ReturnType<typeof createTestHome>>;

  beforeAll(async () => {
    home = await createTestHome();
    vi.mocked(getCurrentHome).mockResolvedValue({
      home: home.home,
      user: home.user,
      today: home.scope.today,
      timeZone: "America/New_York",
    });
  });

  afterAll(async () => {
    await home.cleanup();
  });

  it("creates an item", async () => {
    const fd = new FormData();
    fd.set("name", "Test Furnace");
    fd.set("model", "TF-1");
    fd.set("category", "hvac");
    fd.set("installedYear", "2020");
    fd.set("condition", "good");
    const res = await createItem(fd);
    expect(res.success).toBe(true);
    if (res.success) {
      const [row] = await db.select().from(item).where(eq(item.id, res.id));
      expect(row?.name).toBe("Test Furnace");
    }
  });

  it("validates required fields", async () => {
    const fd = new FormData();
    fd.set("name", "");
    fd.set("category", "hvac");
    const res = await createItem(fd);
    expect(res.success).toBe(false);
    if (!res.success) expect(res.fieldErrors.name).toBeTruthy();
  });

  it("updates and deletes an item", async () => {
    const fd = new FormData();
    fd.set("name", "Old");
    fd.set("category", "kitchen");
    const created = await createItem(fd);
    expect(created.success).toBe(true);
    if (!created.success) return;
    const id = created.id;

    const upd = new FormData();
    upd.set("id", id);
    upd.set("name", "New");
    upd.set("category", "kitchen");
    upd.set("condition", "needs_service");
    const u = await updateItem(upd);
    expect(u.success).toBe(true);

    const [row] = await db.select().from(item).where(eq(item.id, id));
    expect(row?.name).toBe("New");
    expect(row?.condition).toBe("needs_service");

    const del = new FormData();
    del.set("id", id);
    const d = await deleteItem(del);
    expect(d.success).toBe(true);
    const rows = await db.select().from(item).where(eq(item.id, id));
    expect(rows).toHaveLength(0);
  });
});
