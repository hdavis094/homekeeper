import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, Wrench } from "lucide-react";
import { Card, EmptyState, ListRow, StatusPill } from "@/app/ui";
import type { CalendarEntry } from "@/lib/data/tasks";
import type { TaskStatus } from "@/lib/domain/constants";
import { dueText, type TaskLike } from "@/lib/domain/tasks";
import {
  buildMonthMatrix,
  chipLabel,
  formatDayHeading,
  formatMonthHeading,
  groupEntriesByDay,
  nextMonthParam,
  prevMonthParam,
  scheduleHref,
  type ScheduleView,
  WEEKDAYS,
} from "./calendar";

export interface ScheduleHeaderControlsProps {
  monthParam: string;
  view: ScheduleView;
}

export function ScheduleHeaderControls({
  monthParam,
  view,
}: ScheduleHeaderControlsProps) {
  const prevMonth = prevMonthParam(monthParam);
  const nextMonth = nextMonthParam(monthParam);
  const heading = formatMonthHeading(monthParam);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Prev / Month Label / Next */}
      <div className="flex items-center gap-3">
        <Link
          href={scheduleHref({ month: prevMonth, view })}
          aria-label={`Previous month (${formatMonthHeading(prevMonth)})`}
          className="w-9 h-9 rounded-[8px] bg-card border border-border inline-flex items-center justify-center text-[16px] font-semibold text-ink hover:bg-gray-50 transition-colors"
        >
          ‹
        </Link>
        <span className="min-w-[116px] text-center text-[15px] font-bold text-ink">
          {heading}
        </span>
        <Link
          href={scheduleHref({ month: nextMonth, view })}
          aria-label={`Next month (${formatMonthHeading(nextMonth)})`}
          className="w-9 h-9 rounded-[8px] bg-card border border-border inline-flex items-center justify-center text-[16px] font-semibold text-ink hover:bg-gray-50 transition-colors"
        >
          ›
        </Link>
      </div>

      {/* Month / List segmented toggle */}
      <div
        role="group"
        aria-label="Calendar view mode"
        className="inline-flex items-center bg-card border border-border rounded-[8px] p-0.5 h-9"
      >
        <Link
          href={scheduleHref({ month: monthParam, view: "month" })}
          aria-current={view === "month" ? "page" : undefined}
          className={clsx(
            "h-full px-3.5 rounded-[6px] inline-flex items-center justify-center text-[12px] font-semibold transition-colors",
            view === "month"
              ? "bg-primary text-white"
              : "text-muted hover:text-ink"
          )}
        >
          Month
        </Link>
        <Link
          href={scheduleHref({ month: monthParam, view: "list" })}
          aria-current={view === "list" ? "page" : undefined}
          className={clsx(
            "h-full px-3.5 rounded-[6px] inline-flex items-center justify-center text-[12px] font-semibold transition-colors",
            view === "list"
              ? "bg-primary text-white"
              : "text-muted hover:text-ink"
          )}
        >
          List
        </Link>
      </div>
    </div>
  );
}

const chipToneStyles: Record<TaskStatus, string> = {
  overdue: "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]",
  due_soon: "bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A]",
  scheduled: "bg-[#DBEAFE] text-[#2563EB] hover:bg-[#BFDBFE]",
  completed: "bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]",
};

export interface MonthCalendarGridProps {
  monthParam: string;
  entries: readonly CalendarEntry[];
  today: string;
  view: ScheduleView;
}

export function MonthCalendarGrid({
  monthParam,
  entries,
  today,
  view,
}: MonthCalendarGridProps) {
  const weeks = buildMonthMatrix(monthParam);
  const byDate = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date);
    if (list) {
      list.push(entry);
    } else {
      byDate.set(entry.date, [entry]);
    }
  }

  return (
    <div aria-label={`${formatMonthHeading(monthParam)} calendar`}>
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 mb-2.5">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[12px] font-semibold uppercase tracking-wide text-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Card Grid */}
      <div className="bg-card border border-border rounded-[12px] overflow-hidden divide-y divide-divider">
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            className="grid grid-cols-7 divide-x divide-divider"
          >
            {week.map((cell, dayIdx) => {
              const dayEntries = cell.date ? (byDate.get(cell.date) ?? []) : [];
              const visibleEntries = dayEntries.slice(0, 3);
              const overflowCount = Math.max(0, dayEntries.length - 3);
              const isToday = cell.date === today;

              return (
                <div
                  key={cell.date ?? `empty-${weekIdx}-${dayIdx}`}
                  data-date={cell.date ?? undefined}
                  className={clsx(
                    "min-h-[104px] p-2.5 flex flex-col gap-1.5 min-w-0",
                    !cell.inCurrentMonth && "bg-card"
                  )}
                >
                  {cell.dayOfMonth !== null && (
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          "text-[13px] leading-none",
                          isToday
                            ? "font-bold text-primary"
                            : "font-semibold text-ink"
                        )}
                      >
                        {cell.dayOfMonth}
                      </span>
                    </div>
                  )}

                  {visibleEntries.length > 0 && (
                    <div className="flex flex-col gap-1 mt-0.5 min-w-0">
                      {visibleEntries.map((entry) => (
                        <Link
                          key={entry.key}
                          href={`/tasks?edit=${entry.taskId}`}
                          title={chipLabel(entry)}
                          className={clsx(
                            "block w-full px-2 py-1 rounded-[4px] text-[11px] font-semibold leading-tight truncate transition-colors",
                            chipToneStyles[entry.status]
                          )}
                        >
                          {chipLabel(entry)}
                        </Link>
                      ))}
                      {overflowCount > 0 && (
                        <Link
                          href={scheduleHref({ month: monthParam, view: "list" })}
                          className="px-1.5 py-0.5 text-[11px] font-semibold text-muted hover:text-ink transition-colors truncate"
                        >
                          +{overflowCount} more
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Unused `view` prop kept consistent if needed */}
      <span className="sr-only">{view}</span>
    </div>
  );
}

function statusIcon(status: TaskStatus) {
  switch (status) {
    case "overdue":
      return <AlertCircle className="w-4 h-4" />;
    case "due_soon":
      return <Clock className="w-4 h-4" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4" />;
    case "scheduled":
    default:
      return <Wrench className="w-4 h-4" />;
  }
}

function entryMetaText(entry: CalendarEntry, today: string): string {
  const taskLike: TaskLike =
    entry.kind === "completion" || entry.status === "completed"
      ? { dueDate: entry.date, completedAt: entry.date }
      : { dueDate: entry.date, completedAt: null };
  const due = dueText(taskLike, today);
  return entry.location ? `${entry.location} • ${due}` : due;
}

export interface ScheduleListViewProps {
  monthParam: string;
  entries: readonly CalendarEntry[];
  today: string;
}

export function ScheduleListView({
  monthParam,
  entries,
  today,
}: ScheduleListViewProps) {
  const groups = groupEntriesByDay(entries);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="w-5 h-5" />}
        title={`No tasks scheduled in ${formatMonthHeading(monthParam)}`}
        description="Navigate to another month or add a maintenance task to see it on your schedule."
      />
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.date} padding="none" className="overflow-hidden">
          <div className="px-5 py-3 bg-bg/40 border-b border-divider flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-ink">
              {formatDayHeading(group.date)}
            </h2>
            <span className="text-[12px] font-medium text-muted">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          <div>
            {group.entries.map((entry) => (
              <ListRow
                key={entry.key}
                tone={entry.status}
                icon={statusIcon(entry.status)}
                title={chipLabel(entry)}
                meta={entryMetaText(entry, today)}
                trailing={<StatusPill status={entry.status} />}
                href={`/tasks?edit=${entry.taskId}`}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
