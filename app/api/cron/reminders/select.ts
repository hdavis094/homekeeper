import { addDays, todayIn } from "@/lib/domain/dates";
import { sortTasks, type TaskLike } from "@/lib/domain/tasks";

export type ReminderDay = { today: string; isMonday: boolean };

/** Use the same recipient-local date for task selection, weekly scheduling, and delivery markers. */
export function getReminderDay(timeZone: string, now: Date = new Date()): ReminderDay {
  const today = todayIn(timeZone, now);
  return { today, isMonday: new Date(`${today}T00:00:00Z`).getUTCDay() === 1 };
}

/** `remindedTaskIds` contains only deliveries recorded for `today`. Returns a sorted copy. */
export function selectTasksToRemind<T extends TaskLike & { id: string }>(
  tasks: readonly T[],
  today: string,
  remindedTaskIds: readonly string[] = [],
): T[] {
  const reminded = new Set(remindedTaskIds);
  const cutoff = addDays(today, 3);
  return sortTasks(tasks.filter((task) =>
    !task.completedAt && task.dueDate <= cutoff && !reminded.has(task.id),
  ), today);
}

export function shouldSendWeeklySummary(
  recipient: { weeklySummary: boolean; lastWeeklySummaryOn: string | null },
  day: ReminderDay,
): boolean {
  return recipient.weeklySummary && day.isMonday && recipient.lastWeeklySummaryOn !== day.today;
}
