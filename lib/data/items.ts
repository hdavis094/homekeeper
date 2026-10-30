import "server-only";
import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { item, type Item, logEntry, task } from "@/lib/db/schema";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/domain/constants";
import { sortTasks } from "@/lib/domain/tasks";
import { type LogRow, selectLog } from "./log";
import { currentScope, type HomeScope, isUuid } from "./scope";
import { selectTasks, type TaskRow, toTaskRow } from "./tasks";

export type ItemCounts = Record<"all" | ItemCategory, number>;

/** Inventory grid, by name. `counts` cover every category (for the chips; hide categories with 0). */
export async function listItems(filters: { category?: ItemCategory | "all" } = {}) {
  return listItemsFor(await currentScope(), filters);
}

export async function listItemsFor(
  scope: HomeScope,
  filters: { category?: ItemCategory | "all" } = {},
): Promise<{ items: Item[]; counts: ItemCounts }> {
  const all = await db.select().from(item).where(eq(item.homeId, scope.homeId)).orderBy(asc(item.name));
  const counts = Object.fromEntries(["all", ...ITEM_CATEGORIES].map((k) => [k, 0])) as ItemCounts;
  for (const i of all) {
    counts.all += 1;
    counts[i.category] += 1;
  }
  const category = filters.category && filters.category !== "all" ? filters.category : undefined;
  return { items: category ? all.filter((i) => i.category === category) : all, counts };
}

export type ItemDetail = {
  item: Item;
  /** Tasks linked to this item, in list order. */
  tasks: TaskRow[];
  /** Log entries for this item (logged against it directly or via one of its tasks), newest first. */
  log: LogRow[];
  totalCostCents: number;
};

export async function getItem(id: string) {
  return getItemFor(await currentScope(), id);
}

export async function getItemFor(scope: HomeScope, id: string): Promise<ItemDetail | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select()
    .from(item)
    .where(and(eq(item.id, id), eq(item.homeId, scope.homeId)))
    .limit(1);
  if (!row) return null;
  const [taskRows, log] = await Promise.all([
    selectTasks().where(and(eq(task.homeId, scope.homeId), eq(task.itemId, id))),
    selectLog(and(eq(logEntry.homeId, scope.homeId), or(eq(logEntry.itemId, id), eq(task.itemId, id)))),
  ]);
  return {
    item: row,
    tasks: sortTasks(
      taskRows.map((r) => toTaskRow(r, scope.today)),
      scope.today,
    ),
    log,
    totalCostCents: log.reduce((sum, e) => sum + (e.costCents ?? 0), 0),
  };
}

export type ItemOption = { id: string; name: string; category: ItemCategory };

/** For item selects (Add Task, Log a Repair). */
export async function listItemOptions() {
  return listItemOptionsFor(await currentScope());
}

export async function listItemOptionsFor(scope: HomeScope): Promise<ItemOption[]> {
  return db
    .select({ id: item.id, name: item.name, category: item.category })
    .from(item)
    .where(eq(item.homeId, scope.homeId))
    .orderBy(asc(item.name));
}
