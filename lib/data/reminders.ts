import "server-only";
// Cron-only reads and writes for lane H. NOT session-scoped: never import from a page or action.
import { and, eq, gte, isNull, lte, notExists, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { home, logEntry, reminderSent, task, user } from "@/lib/db/schema";
import { addDays } from "@/lib/domain/dates";
import { sortTasks } from "@/lib/domain/tasks";
import { type LogRow, selectLog } from "./log";
import { selectTasks, type TaskRow, toTaskRow } from "./tasks";

export type ReminderRecipient = {
  homeId: string;
  userId: string;
  email: string;
  name: string;
  timeZone: string;
  emailReminders: boolean;
  weeklySummary: boolean;
  lastWeeklySummaryOn: string | null;
};

/** Homes with email reminders or the weekly summary turned on, with their user's email and time zone. */
export async function listReminderRecipients(): Promise<ReminderRecipient[]> {
  return db
    .select({
      homeId: home.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      timeZone: user.timeZone,
      emailReminders: home.emailReminders,
      weeklySummary: home.weeklySummary,
      lastWeeklySummaryOn: home.lastWeeklySummaryOn,
    })
    .from(home)
    .innerJoin(user, eq(home.userId, user.id))
    .where(or(eq(home.emailReminders, true), eq(home.weeklySummary, true)));
}

/**
 * Open tasks that are overdue or due within `withinDays` of `today` (the user's today) and haven't
 * had a reminder sent on `today`. In list order (overdue first).
 */
export async function getTasksToRemind(homeId: string, today: string, withinDays = 3): Promise<TaskRow[]> {
  const rows = await selectTasks().where(
    and(
      eq(task.homeId, homeId),
      isNull(task.completedAt),
      lte(task.dueDate, addDays(today, withinDays)),
      notExists(
        db
          .select()
          .from(reminderSent)
          .where(and(eq(reminderSent.taskId, task.id), eq(reminderSent.sentOn, today))),
      ),
    ),
  );
  return sortTasks(
    rows.map((r) => toTaskRow(r, today)),
    today,
  );
}

/** Records the weekly summary as sent on `sentOn` (the user's local date). */
export async function markWeeklySummarySent(homeId: string, sentOn: string): Promise<void> {
  await db.update(home).set({ lastWeeklySummaryOn: sentOn }).where(eq(home.id, homeId));
}

/** Records reminders as sent for `sentOn`; repeated calls are no-ops. */
export async function markReminderSent(taskIds: readonly string[], sentOn: string): Promise<void> {
  if (taskIds.length === 0) return;
  await db
    .insert(reminderSent)
    .values(taskIds.map((taskId) => ({ taskId, sentOn })))
    .onConflictDoNothing();
}

export type WeeklySummary = {
  /** Log entries from the 7 days before `today`. */
  completed: LogRow[];
  spentCents: number;
  /** Open tasks due today through 7 days out. */
  upcoming: TaskRow[];
  overdue: TaskRow[];
};

export async function getWeeklySummary(homeId: string, today: string): Promise<WeeklySummary> {
  const [completed, open] = await Promise.all([
    selectLog(
      and(eq(logEntry.homeId, homeId), gte(logEntry.date, addDays(today, -7)), lte(logEntry.date, addDays(today, -1))),
    ),
    selectTasks().where(
      and(eq(task.homeId, homeId), isNull(task.completedAt), lte(task.dueDate, addDays(today, 7))),
    ),
  ]);
  const tasks = sortTasks(
    open.map((r) => toTaskRow(r, today)),
    today,
  );
  return {
    completed,
    spentCents: completed.reduce((sum, e) => sum + (e.costCents ?? 0), 0),
    upcoming: tasks.filter((t) => t.status !== "overdue"),
    overdue: tasks.filter((t) => t.status === "overdue"),
  };
}
