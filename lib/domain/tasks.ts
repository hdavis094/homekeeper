import {
  DUE_SOON_DAYS,
  type Recurrence,
  type TaskStatus,
  TASK_STATUSES,
} from "./constants";
import { addDays, addMonths, daysBetween, formatShortDate } from "./dates";

/** The fields status rules need. `completedAt` is a calendar date, set only on completed non-recurring tasks. */
export type TaskLike = { dueDate: string; completedAt: string | null };

export function taskStatus(task: TaskLike, today: string): TaskStatus {
  if (task.completedAt) return "completed";
  const days = daysBetween(today, task.dueDate);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  return "scheduled";
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/** 1–6 → days, then weeks, then months (≥60 days), then years (≥365 days). */
function span(days: number): string {
  if (days < 7) return plural(days, "day");
  if (days < 60) return plural(Math.round(days / 7), "week");
  if (days < 365) return plural(Math.round(days / 30), "month");
  return plural(Math.round(days / 365), "year");
}

/** "Overdue by 2 days", "Due today", "Due tomorrow", "Due in 3 days", "Due in 1 week", "Completed Sep 28". */
export function dueText(task: TaskLike, today: string): string {
  if (task.completedAt) return `Completed ${formatShortDate(task.completedAt, today)}`;
  const days = daysBetween(today, task.dueDate);
  if (days < 0) return `Overdue by ${span(-days)}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${span(days)}`;
}

function step(date: string, recurrence: Recurrence, times: number): string {
  const n = recurrence.every * times;
  switch (recurrence.unit) {
    case "day":
      return addDays(date, n);
    case "week":
      return addDays(date, n * 7);
    case "month":
      return addMonths(date, n);
    case "year":
      return addMonths(date, n * 12);
  }
}

/**
 * The next due date after `date`. With `after`, keeps stepping until the result is later than `after`
 * (so completing a long-overdue task doesn't leave it overdue). Steps are taken from the original date,
 * so month-end anchors survive short months.
 */
export function nextDueDate(date: string, recurrence: Recurrence, after?: string): string {
  let times = 1;
  let next = step(date, recurrence, times);
  while (after !== undefined && next <= after) {
    times += 1;
    next = step(date, recurrence, times);
  }
  return next;
}

export function recurrenceText(recurrence: Recurrence | null): string {
  if (!recurrence) return "Does not repeat";
  if (recurrence.every === 1) return `Every ${recurrence.unit}`;
  return `Every ${plural(recurrence.every, recurrence.unit)}`;
}

/** Overdue → due soon → scheduled (each by due date), then completed (most recent first). Returns a copy. */
export function sortTasks<T extends TaskLike>(tasks: readonly T[], today: string): T[] {
  const rank = (t: T) => TASK_STATUSES.indexOf(taskStatus(t, today));
  return [...tasks].sort((a, b) => {
    const byStatus = rank(a) - rank(b);
    if (byStatus !== 0) return byStatus;
    if (a.completedAt && b.completedAt) return b.completedAt.localeCompare(a.completedAt);
    return a.dueDate.localeCompare(b.dueDate);
  });
}
