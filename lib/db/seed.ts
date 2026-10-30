// Writes the demo dataset. Idempotent: deletes the demo user (cascading to their home and data)
// and recreates everything. Used by scripts/seed.ts and the DB integration test.
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { todayIn } from "@/lib/domain/dates";
import { db } from "./index";
import { home, item, logEntry, task, user, vendor } from "./schema";
import { buildSeedData, DEMO_USER } from "./seed-data";

export async function seedDemo(options: { today?: string } = {}) {
  const today = options.today ?? todayIn(DEMO_USER.timeZone);
  const data = buildSeedData(today);

  await db.delete(user).where(eq(user.email, DEMO_USER.email));
  // Through Better Auth so the password hash (and the empty-home hook) are real.
  const { user: created } = await auth.api.signUpEmail({ body: DEMO_USER });

  const [homeRow] = await db.update(home).set(data.home).where(eq(home.userId, created.id)).returning();
  if (!homeRow) throw new Error("The sign-up hook didn't create a home");
  const homeId = homeRow.id;

  const items = await db
    .insert(item)
    .values(data.items.map((i) => ({ ...i, homeId })))
    .returning({ id: item.id, name: item.name });
  const vendors = await db
    .insert(vendor)
    .values(data.vendors.map((v) => ({ ...v, homeId })))
    .returning({ id: vendor.id, name: vendor.name });
  const itemId = (name: string | null) => (name ? idOf(items, name) : null);
  const vendorId = (name: string | null) => (name ? idOf(vendors, name) : null);

  const tasks = await db
    .insert(task)
    .values(
      data.tasks.map(({ itemName, vendorName, ...t }) => ({
        ...t,
        homeId,
        itemId: itemId(itemName),
        vendorId: vendorId(vendorName),
      })),
    )
    .returning({ id: task.id, name: task.title });
  await db.insert(logEntry).values(
    data.log.map(({ itemName, vendorName, taskTitle, ...e }) => ({
      ...e,
      homeId,
      itemId: itemId(itemName),
      vendorId: vendorId(vendorName),
      taskId: taskTitle ? idOf(tasks, taskTitle) : null,
    })),
  );

  return {
    userId: created.id,
    homeId,
    today,
    counts: { items: items.length, vendors: vendors.length, tasks: tasks.length, log: data.log.length },
  };
}

function idOf(rows: { id: string; name: string }[], name: string): string {
  const row = rows.find((r) => r.name === name);
  if (!row) throw new Error(`Seed reference not found: ${name}`);
  return row.id;
}
