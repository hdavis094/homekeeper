import "server-only";
import { and, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { item, type LogEntry, logEntry, task, vendor } from "@/lib/db/schema";
import { monthRange } from "@/lib/domain/dates";
import { currentScope, type HomeScope } from "./scope";

export type LogRow = LogEntry & {
  vendorName: string | null;
  itemName: string | null;
  taskTitle: string | null;
};

/** @internal Log entries + vendor/item/task names, newest first. */
export async function selectLog(where: SQL | undefined, limit?: number): Promise<LogRow[]> {
  const query = db
    .select({ entry: logEntry, vendorName: vendor.name, itemName: item.name, taskTitle: task.title })
    .from(logEntry)
    .leftJoin(vendor, eq(logEntry.vendorId, vendor.id))
    .leftJoin(task, eq(logEntry.taskId, task.id))
    .leftJoin(item, eq(logEntry.itemId, item.id))
    .where(where)
    .orderBy(desc(logEntry.date), desc(logEntry.createdAt))
    .$dynamic();
  const rows = await (limit ? query.limit(limit) : query);
  return rows.map(({ entry, ...names }) => ({ ...entry, ...names }));
}

export type LogFilters = { from?: string; to?: string; limit?: number };

/** Completed work / expenses, newest first, optionally within [from, to]. */
export async function listLogEntries(filters: LogFilters = {}) {
  return listLogEntriesFor(await currentScope(), filters);
}

export async function listLogEntriesFor(scope: HomeScope, filters: LogFilters = {}): Promise<LogRow[]> {
  return selectLog(
    and(
      eq(logEntry.homeId, scope.homeId),
      filters.from ? gte(logEntry.date, filters.from) : undefined,
      filters.to ? lte(logEntry.date, filters.to) : undefined,
    ),
    filters.limit,
  );
}

/** Total cost (cents) of log entries dated this calendar month. */
export async function getSpendThisMonth() {
  return getSpendThisMonthFor(await currentScope());
}

export async function getSpendThisMonthFor(scope: HomeScope): Promise<number> {
  const { start, end } = monthRange(scope.today);
  const [row] = await db
    .select({ total: sql<string | null>`sum(${logEntry.costCents})` })
    .from(logEntry)
    .where(and(eq(logEntry.homeId, scope.homeId), gte(logEntry.date, start), lte(logEntry.date, end)));
  return Number(row?.total ?? 0);
}
