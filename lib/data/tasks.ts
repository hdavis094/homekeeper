import "server-only";
import { and, eq, gte, ilike, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { item, logEntry, task, type Task, vendor } from "@/lib/db/schema";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain/constants";
import { dueText, sortTasks, taskStatus } from "@/lib/domain/tasks";
import { currentScope, type HomeScope, likePattern } from "./scope";

export type TaskRow = Task & {
  status: TaskStatus;
  /** "Overdue by 2 days", "Due in 1 week", "Completed Sep 28" */
  dueText: string;
  itemName: string | null;
  vendorName: string | null;
};

export type TaskCounts = Record<"all" | TaskStatus, number>;

export type TaskFilters = { status?: TaskStatus | "all"; q?: string };

const taskColumns = { task, itemName: item.name, vendorName: vendor.name };

/** @internal Shared with reminders.ts. */
export function toTaskRow(
  row: { task: Task; itemName: string | null; vendorName: string | null },
  today: string,
): TaskRow {
  return {
    ...row.task,
    status: taskStatus(row.task, today),
    dueText: dueText(row.task, today),
    itemName: row.itemName,
    vendorName: row.vendorName,
  };
}

/** @internal Task + linked item/vendor names. */
export function selectTasks() {
  return db
    .select(taskColumns)
    .from(task)
    .leftJoin(item, eq(task.itemId, item.id))
    .leftJoin(vendor, eq(task.vendorId, vendor.id));
}

function emptyCounts(): TaskCounts {
  return Object.fromEntries(["all", ...TASK_STATUSES].map((k) => [k, 0])) as TaskCounts;
}

/**
 * Tasks page: rows sorted overdue → due soon → scheduled → completed, filtered by `status` and a
 * search over title/location/notes. `counts` reflect the search but not the status filter (for the chips).
 */
export async function listTasks(filters: TaskFilters = {}) {
  return listTasksFor(await currentScope(), filters);
}

export async function listTasksFor(
  scope: HomeScope,
  filters: TaskFilters = {},
): Promise<{ tasks: TaskRow[]; counts: TaskCounts }> {
  const q = filters.q?.trim();
  const rows = await selectTasks().where(
    and(
      eq(task.homeId, scope.homeId),
      q
        ? or(ilike(task.title, likePattern(q)), ilike(task.location, likePattern(q)), ilike(task.notes, likePattern(q)))
        : undefined,
    ),
  );
  const all = sortTasks(
    rows.map((r) => toTaskRow(r, scope.today)),
    scope.today,
  );
  const counts = emptyCounts();
  for (const t of all) {
    counts.all += 1;
    counts[t.status] += 1;
  }
  const status = filters.status && filters.status !== "all" ? filters.status : undefined;
  return { tasks: status ? all.filter((t) => t.status === status) : all, counts };
}

export async function getTask(id: string) {
  return getTaskFor(await currentScope(), id);
}

export async function getTaskFor(scope: HomeScope, id: string): Promise<TaskRow | null> {
  const [row] = await selectTasks()
    .where(and(eq(task.id, id), eq(task.homeId, scope.homeId)))
    .limit(1);
  return row ? toTaskRow(row, scope.today) : null;
}

/** Home dashboard "Upcoming Maintenance": the first `limit` open tasks in list order (overdue first). */
export async function listUpcomingTasks(limit = 5) {
  return listUpcomingTasksFor(await currentScope(), limit);
}

export async function listUpcomingTasksFor(scope: HomeScope, limit = 5): Promise<TaskRow[]> {
  const rows = await selectTasks()
    .where(and(eq(task.homeId, scope.homeId), isNull(task.completedAt)))
    .orderBy(task.dueDate);
  return sortTasks(
    rows.map((r) => toTaskRow(r, scope.today)),
    scope.today,
  ).slice(0, limit);
}

export type CalendarEntry = {
  /** Unique per entry (task id for open tasks, log entry id for completions). */
  key: string;
  kind: "task" | "completion";
  /** Link target: `/tasks?edit=<taskId>`. */
  taskId: string;
  title: string;
  location: string | null;
  date: string;
  status: TaskStatus;
};

/**
 * Schedule: open tasks on their due date, plus task completions (log entries with a task) on the
 * date they were done, as `completed`. Sorted by date, then status order.
 */
export async function listCalendarEntries(from: string, to: string) {
  return listCalendarEntriesFor(await currentScope(), from, to);
}

export async function listCalendarEntriesFor(scope: HomeScope, from: string, to: string): Promise<CalendarEntry[]> {
  const [open, done] = await Promise.all([
    db
      .select()
      .from(task)
      .where(
        and(
          eq(task.homeId, scope.homeId),
          isNull(task.completedAt),
          gte(task.dueDate, from),
          lte(task.dueDate, to),
        ),
      ),
    db
      .select({ entry: logEntry, location: task.location })
      .from(logEntry)
      .innerJoin(task, eq(logEntry.taskId, task.id))
      .where(
        and(
          eq(logEntry.homeId, scope.homeId),
          isNotNull(logEntry.taskId),
          gte(logEntry.date, from),
          lte(logEntry.date, to),
        ),
      ),
  ]);

  const entries: CalendarEntry[] = [
    ...open.map((t) => ({
      key: t.id,
      kind: "task" as const,
      taskId: t.id,
      title: t.title,
      location: t.location,
      date: t.dueDate,
      status: taskStatus(t, scope.today),
    })),
    ...done.map(({ entry, location }) => ({
      key: entry.id,
      kind: "completion" as const,
      taskId: entry.taskId!,
      title: entry.title,
      location,
      date: entry.date,
      status: "completed" as const,
    })),
  ];
  return entries.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status) ||
      a.title.localeCompare(b.title),
  );
}
