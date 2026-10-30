import { type ItemCategory, type ItemCondition, UPCOMING_DAYS } from "./constants";
import { addMonths, daysBetween } from "./dates";
import { type TaskLike, taskStatus } from "./tasks";

export type HomeStats = {
  /** Open tasks due today through 30 days out. */
  upcoming: number;
  overdue: number;
  /** Log entries (completed work) dated this calendar month. */
  completedThisMonth: number;
  completedLastMonth: number;
  completedDelta: number;
  spentThisMonthCents: number;
};

export function homeStats(input: {
  tasks: readonly TaskLike[];
  logEntries: readonly { date: string; costCents: number | null }[];
  today: string;
}): HomeStats {
  const { tasks, logEntries, today } = input;
  let upcoming = 0;
  let overdue = 0;
  for (const task of tasks) {
    const status = taskStatus(task, today);
    if (status === "overdue") overdue += 1;
    else if (status !== "completed" && daysBetween(today, task.dueDate) <= UPCOMING_DAYS) upcoming += 1;
  }

  const thisMonth = today.slice(0, 7);
  const lastMonth = addMonths(`${thisMonth}-01`, -1).slice(0, 7);
  let completedThisMonth = 0;
  let completedLastMonth = 0;
  let spentThisMonthCents = 0;
  for (const entry of logEntries) {
    const month = entry.date.slice(0, 7);
    if (month === thisMonth) {
      completedThisMonth += 1;
      spentThisMonthCents += entry.costCents ?? 0;
    } else if (month === lastMonth) {
      completedLastMonth += 1;
    }
  }

  return {
    upcoming,
    overdue,
    completedThisMonth,
    completedLastMonth,
    completedDelta: completedThisMonth - completedLastMonth,
    spentThisMonthCents,
  };
}

export function healthScore(input: { overdue: number; itemsNeedingService: number }): number {
  const score = 100 - 10 * input.overdue - 5 * input.itemsNeedingService;
  return Math.max(0, Math.min(100, score));
}

export function healthLabel(score: number): "Looking good" | "Needs some attention" | "At risk" {
  if (score >= 85) return "Looking good";
  if (score >= 60) return "Needs some attention";
  return "At risk";
}

export const SYSTEMS = [
  { system: "hvac", label: "HVAC" },
  { system: "roof", label: "Roof" },
  { system: "plumbing", label: "Plumbing" },
  { system: "electrical", label: "Electrical" },
] as const satisfies readonly { system: ItemCategory; label: string }[];

export type SystemStatus = {
  system: (typeof SYSTEMS)[number]["system"];
  label: string;
  status: "good" | "needs_attention";
};

/**
 * Home Systems card: a system needs attention when any of its items needs service
 * or any open task linked to one of its items is overdue.
 */
export function systemStatus(
  items: readonly { id: string; category: ItemCategory; condition: ItemCondition }[],
  tasks: readonly (TaskLike & { itemId: string | null })[],
  today: string,
): SystemStatus[] {
  const overdueItemIds = new Set(
    tasks.filter((t) => t.itemId && taskStatus(t, today) === "overdue").map((t) => t.itemId),
  );
  return SYSTEMS.map(({ system, label }) => {
    const inSystem = items.filter((item) => item.category === system);
    const needsAttention = inSystem.some(
      (item) => item.condition === "needs_service" || overdueItemIds.has(item.id),
    );
    return { system, label, status: needsAttention ? "needs_attention" : "good" };
  });
}
