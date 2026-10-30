import type { StatCardTone } from "@/app/ui/stat-card";
import type { Dashboard } from "@/lib/data/stats";
import type { TaskRow } from "@/lib/data/tasks";
import type { TaskStatus } from "@/lib/domain/constants";
import { formatCents } from "@/lib/domain/format";
import type { HomeStats, SystemStatus } from "@/lib/domain/stats";

export type HomeStatCardViewModel = {
  id: "upcoming" | "overdue" | "completed" | "health";
  label: string;
  value: string;
  sublabel: string;
  tone: StatCardTone;
};

export type UpcomingMaintenanceRowViewModel = {
  id: string;
  title: string;
  meta: string;
  status: TaskStatus;
  href: string;
};

export type HomeSystemViewModel = SystemStatus & {
  pillLabel: "Good" | "Needs Attention";
};

export type QuickActionItem = {
  label: string;
  href: string;
  bulletColor: string;
};

export const QUICK_ACTIONS: readonly QuickActionItem[] = [
  {
    label: "Add Maintenance Task",
    href: "/tasks?new=1",
    bulletColor: "#2563EB",
  },
  {
    label: "Log a Repair",
    href: "/tasks?log=1",
    bulletColor: "#D97706",
  },
  {
    label: "Set a Reminder",
    href: "/settings#notifications",
    bulletColor: "#16A34A",
  },
] as const;

export function firstName(fullName: string | null | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || "there";
}

export function greetingTitle(fullName: string | null | undefined): string {
  return `Welcome back, ${firstName(fullName)}`;
}

export function formatCompletedSublabel(
  stats: Pick<HomeStats, "completedDelta" | "spentThisMonthCents">,
): string {
  const deltaText =
    stats.completedDelta >= 0
      ? `+${stats.completedDelta} vs last month`
      : `${stats.completedDelta} vs last month`;
  return `${deltaText} · ${formatCents(stats.spentThisMonthCents)} spent`;
}

export function formatTaskMeta(
  task: Pick<TaskRow, "location" | "dueText">,
): string {
  const loc = task.location?.trim();
  return loc ? `${loc} • ${task.dueText}` : task.dueText;
}

export type HomeViewModel = {
  greeting: {
    title: string;
    subtitle: string;
  };
  statCards: HomeStatCardViewModel[];
  upcomingMaintenance: UpcomingMaintenanceRowViewModel[];
  systems: HomeSystemViewModel[];
  quickActions: readonly QuickActionItem[];
  isEmpty: {
    tasks: boolean;
    items: boolean;
  };
};

export function buildHomeViewModel(input: {
  userName: string | null | undefined;
  dashboard: Dashboard;
  upcomingTasks: readonly TaskRow[];
  itemCount?: number;
}): HomeViewModel {
  const { userName, dashboard, upcomingTasks, itemCount = 1 } = input;
  const { stats, health, systems } = dashboard;

  return {
    greeting: {
      title: greetingTitle(userName),
      subtitle: "Here's what's happening with your home today.",
    },
    statCards: [
      {
        id: "upcoming",
        label: "Upcoming Tasks",
        value: String(stats.upcoming),
        sublabel: "Next 30 days",
        tone: "ink",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: String(stats.overdue),
        sublabel: "Needs attention",
        tone: "overdue",
      },
      {
        id: "completed",
        label: "Completed This Month",
        value: String(stats.completedThisMonth),
        sublabel: formatCompletedSublabel(stats),
        tone: "completed",
      },
      {
        id: "health",
        label: "Home Health Score",
        value: `${health.score}%`,
        sublabel: health.label,
        tone: "primary",
      },
    ],
    upcomingMaintenance: upcomingTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      meta: formatTaskMeta(t),
      status: t.status,
      href: `/tasks?edit=${t.id}`,
    })),
    systems: systems.map((s) => ({
      ...s,
      pillLabel: s.status === "good" ? "Good" : "Needs Attention",
    })),
    quickActions: QUICK_ACTIONS,
    isEmpty: {
      tasks: upcomingTasks.length === 0,
      items: itemCount === 0,
    },
  };
}
