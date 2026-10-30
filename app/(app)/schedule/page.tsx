import React from "react";
import { PageHeader } from "@/app/ui";
import {
  monthDateRange,
  parseMonthParam,
  parseViewParam,
} from "@/app/ui/schedule/calendar";
import {
  MonthCalendarGrid,
  ScheduleHeaderControls,
  ScheduleListView,
} from "@/app/ui/schedule/schedule-views";
import { listCalendarEntries } from "@/lib/data/tasks";
import { getCurrentHome } from "@/lib/session";

export interface SchedulePageProps {
  searchParams: Promise<{
    month?: string | string[];
    view?: string | string[];
  }>;
}

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const [resolvedParams, { today }] = await Promise.all([
    searchParams,
    getCurrentHome(),
  ]);

  const { monthParam } = parseMonthParam(resolvedParams.month, today);
  const view = parseViewParam(resolvedParams.view);
  const { from, to } = monthDateRange(monthParam);
  const entries = await listCalendarEntries(from, to);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        subtitle="A month-by-month view of your recurring home maintenance."
        actions={
          <ScheduleHeaderControls monthParam={monthParam} view={view} />
        }
      />

      {view === "list" ? (
        <ScheduleListView
          monthParam={monthParam}
          entries={entries}
          today={today}
        />
      ) : (
        <>
          {/* Mobile (< 768px): List view by default */}
          <div className="md:hidden">
            <ScheduleListView
              monthParam={monthParam}
              entries={entries}
              today={today}
            />
          </div>

          {/* Desktop (>= 768px): Month calendar grid */}
          <div className="hidden md:block">
            <MonthCalendarGrid
              monthParam={monthParam}
              entries={entries}
              today={today}
              view={view}
            />
          </div>
        </>
      )}
    </div>
  );
}
