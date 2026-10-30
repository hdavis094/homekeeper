import Link from "next/link";
import { AlertTriangle, CalendarDays, Check, CheckCircle2, Clock } from "lucide-react";
import { IconTile } from "@/app/ui/icon-tile";
import { StatusPill } from "@/app/ui/status-pill";
import type { TaskRow } from "@/lib/data/tasks";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/domain/constants";

const STATUS_ICONS: Record<TaskStatus, typeof Clock> = {
  overdue: AlertTriangle,
  due_soon: Clock,
  scheduled: CalendarDays,
  completed: CheckCircle2,
};

/** Rows per tasks.png: tinted icon tile, title, "location • due text", status pill. */
export function TaskList({
  tasks,
  hrefFor,
}: {
  tasks: TaskRow[];
  /** Builds a link that keeps the current filters, e.g. `{ edit: id }` → `/tasks?status=overdue&edit=…`. */
  hrefFor: (params: Record<string, string>) => string;
}) {
  return (
    <ul className="bg-card border border-border rounded-[12px] overflow-hidden">
      {tasks.map((t) => (
        <TaskListRow
          key={t.id}
          task={t}
          editHref={hrefFor({ edit: t.id })}
          completeHref={t.status === "completed" ? null : hrefFor({ complete: t.id })}
        />
      ))}
    </ul>
  );
}

function TaskListRow({
  task,
  editHref,
  completeHref,
}: {
  task: TaskRow;
  editHref: string;
  completeHref: string | null;
}) {
  const Icon = STATUS_ICONS[task.status];
  return (
    <li className="relative flex items-center gap-3 sm:gap-4 py-3.5 px-4 sm:px-5 border-b border-divider last:border-b-0 hover:bg-bg/50 transition-colors">
      <IconTile tone={task.status}>
        <Icon aria-hidden="true" className="w-4 h-4" />
      </IconTile>
      <div className="min-w-0 flex-1">
        {/* Stretched link: the whole row opens the editor; the complete button sits above it. */}
        <Link
          href={editHref}
          scroll={false}
          className="block text-[14px] font-semibold text-ink truncate after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary/40"
        >
          {task.title}
        </Link>
        <p className="text-[13px] text-muted sm:truncate mt-0.5">
          {task.location && (
            <>
              {task.location}
              <span aria-hidden="true" className="mx-1.5">
                •
              </span>
            </>
          )}
          {task.dueText}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {completeHref && (
          <Link
            href={completeHref}
            scroll={false}
            aria-label={`Mark "${task.title}" complete`}
            title="Mark complete"
            className="relative z-10 max-sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-muted-2 hover:text-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
          >
            <Check aria-hidden="true" className="w-4 h-4" />
          </Link>
        )}
        <StatusPill status={task.status}>{TASK_STATUS_LABELS[task.status]}</StatusPill>
      </div>
    </li>
  );
}
