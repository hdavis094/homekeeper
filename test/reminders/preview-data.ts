import type { TaskReminderProps } from "@/emails/task-reminder";
import type { WeeklySummaryProps } from "@/emails/weekly-summary";

export const reminderPreview: TaskReminderProps = {
  name: "Alex Morgan",
  today: "2026-11-02",
  appUrl: "http://localhost:3108",
  tasks: [
    { id: "sump-pump", title: "Inspect Sump Pump", location: "Basement", dueDate: "2026-10-28", completedAt: null },
    { id: "water-heater", title: "Flush Water Heater", location: "Basement", dueDate: "2026-10-31", completedAt: null },
    { id: "hvac-filter", title: "Replace HVAC Filter", location: "Hallway", dueDate: "2026-11-04", completedAt: null },
  ],
};

export const weeklyPreview: WeeklySummaryProps = {
  name: reminderPreview.name,
  today: reminderPreview.today,
  appUrl: reminderPreview.appUrl,
  summary: {
    completed: [
      { id: "gutter", title: "Clean Gutters", date: "2026-11-01", costCents: 9500 },
      { id: "detectors", title: "Test Smoke Detectors", date: "2026-10-29", costCents: 1800 },
    ],
    spentCents: 11300,
    upcoming: [
      reminderPreview.tasks[2],
      { id: "range-hood", title: "Clean Range Hood Filter", location: "Kitchen", dueDate: "2026-11-07", completedAt: null },
    ],
    overdue: reminderPreview.tasks.slice(0, 2),
  },
};
