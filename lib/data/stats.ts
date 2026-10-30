import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { item, logEntry, task } from "@/lib/db/schema";
import { addMonths } from "@/lib/domain/dates";
import {
  healthLabel,
  healthScore,
  type HomeStats,
  homeStats,
  type SystemStatus,
  systemStatus,
} from "@/lib/domain/stats";
import { currentScope, type HomeScope } from "./scope";

export type Dashboard = {
  stats: HomeStats;
  health: { score: number; label: ReturnType<typeof healthLabel> };
  systems: SystemStatus[];
};

/** Home dashboard numbers: stat cards, health score, Home Systems. */
export async function getDashboard() {
  return getDashboardFor(await currentScope());
}

export async function getDashboardFor(scope: HomeScope): Promise<Dashboard> {
  const lastMonthStart = addMonths(`${scope.today.slice(0, 7)}-01`, -1);
  const [tasks, logEntries, items] = await Promise.all([
    db
      .select({ dueDate: task.dueDate, completedAt: task.completedAt, itemId: task.itemId })
      .from(task)
      .where(eq(task.homeId, scope.homeId)),
    db
      .select({ date: logEntry.date, costCents: logEntry.costCents })
      .from(logEntry)
      .where(and(eq(logEntry.homeId, scope.homeId), gte(logEntry.date, lastMonthStart))),
    db
      .select({ id: item.id, category: item.category, condition: item.condition })
      .from(item)
      .where(eq(item.homeId, scope.homeId)),
  ]);

  const stats = homeStats({ tasks, logEntries, today: scope.today });
  const score = healthScore({
    overdue: stats.overdue,
    itemsNeedingService: items.filter((i) => i.condition === "needs_service").length,
  });
  return {
    stats,
    health: { score, label: healthLabel(score) },
    systems: systemStatus(items, tasks, scope.today),
  };
}
