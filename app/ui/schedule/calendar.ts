import { addMonths, monthRange } from "@/lib/domain/dates";
import type { CalendarEntry } from "@/lib/data/tasks";

export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export type ScheduleView = "month" | "list";

export interface ParsedMonth {
  year: number;
  month: number;
  monthParam: string;
}

export interface CalendarCell {
  date: string | null;
  dayOfMonth: number | null;
  inCurrentMonth: boolean;
}

export interface DayGroup {
  date: string;
  entries: CalendarEntry[];
}

const MONTH_PARAM_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/**
 * Parses `?month=YYYY-MM`, falling back to the month of `today` (`YYYY-MM-DD`).
 */
export function parseMonthParam(
  raw: string | string[] | undefined,
  today: string
): ParsedMonth {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = candidate?.trim() ?? "";
  const match = MONTH_PARAM_RE.exec(trimmed);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      monthParam: trimmed,
    };
  }

  const fallbackMonth = today.slice(0, 7);
  const fallbackMatch = MONTH_PARAM_RE.exec(fallbackMonth);
  const year = fallbackMatch ? Number(fallbackMatch[1]) : 2026;
  const month = fallbackMatch ? Number(fallbackMatch[2]) : 1;
  return {
    year,
    month,
    monthParam: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`,
  };
}

/**
 * Parses `?view=list|month`, defaulting to `"month"`.
 */
export function parseViewParam(
  raw: string | string[] | undefined
): ScheduleView {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return candidate === "list" ? "list" : "month";
}

/**
 * Previous calendar month in `YYYY-MM` format.
 */
export function prevMonthParam(monthParam: string): string {
  return addMonths(`${monthParam}-01`, -1).slice(0, 7);
}

/**
 * Next calendar month in `YYYY-MM` format.
 */
export function nextMonthParam(monthParam: string): string {
  return addMonths(`${monthParam}-01`, 1).slice(0, 7);
}

/**
 * Builds a `/schedule` URL preserving `month` and `view`.
 */
export function scheduleHref(params: {
  month: string;
  view?: ScheduleView;
}): string {
  const search = new URLSearchParams();
  search.set("month", params.month);
  if (params.view === "list") {
    search.set("view", "list");
  }
  return `/schedule?${search.toString()}`;
}

/**
 * Formats `YYYY-MM` as `"March 2026"`.
 */
export function formatMonthHeading(monthParam: string): string {
  return toUtcDate(`${monthParam}-01`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats `YYYY-MM-DD` as `"Monday, March 2"`.
 */
export function formatDayHeading(date: string): string {
  return toUtcDate(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * First and last calendar date (`YYYY-MM-DD`) of a `YYYY-MM` month.
 */
export function monthDateRange(monthParam: string): {
  from: string;
  to: string;
} {
  const { start, end } = monthRange(`${monthParam}-01`);
  return { from: start, to: end };
}

/**
 * Builds a 5- or 6-row Sunday-first matrix (7 columns per week) for `monthParam` (`YYYY-MM`).
 * Leading and trailing out-of-month cells have `date: null`, `dayOfMonth: null`, `inCurrentMonth: false`.
 */
export function buildMonthMatrix(monthParam: string): CalendarCell[][] {
  const { from, to } = monthDateRange(monthParam);
  const firstDate = toUtcDate(from);
  const lastDate = toUtcDate(to);
  const leadingEmpty = firstDate.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const totalDays = lastDate.getUTCDate();

  const totalCellsNeeded = leadingEmpty + totalDays;
  const numWeeks = Math.max(5, Math.ceil(totalCellsNeeded / 7));
  const totalCells = numWeeks * 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leadingEmpty + 1;
    if (dayNum >= 1 && dayNum <= totalDays) {
      const date = `${monthParam}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        date,
        dayOfMonth: dayNum,
        inCurrentMonth: true,
      });
    } else {
      cells.push({
        date: null,
        dayOfMonth: null,
        inCurrentMonth: false,
      });
    }
  }

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    weeks.push(cells.slice(w * 7, (w + 1) * 7));
  }
  return weeks;
}

/**
 * Formats a calendar chip label: overdue tasks are prefixed with `"Overdue: "`.
 */
export function chipLabel(entry: Pick<CalendarEntry, "title" | "status">): string {
  return entry.status === "overdue" ? `Overdue: ${entry.title}` : entry.title;
}

/**
 * Groups calendar entries by their `YYYY-MM-DD` date in ascending date order.
 */
export function groupEntriesByDay(
  entries: readonly CalendarEntry[]
): DayGroup[] {
  const map = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const existing = map.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(entry.date, [entry]);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }));
}
