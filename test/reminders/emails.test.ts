import { createElement } from "react";
import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import TaskReminder from "@/emails/task-reminder";
import WeeklySummary from "@/emails/weekly-summary";
import { reminderPreview, weeklyPreview } from "./preview-data";

describe("reminder email rendering", () => {
  it("renders every reminder with due text, location, app link, and notification preferences", async () => {
    const html = await render(createElement(TaskReminder, reminderPreview));
    for (const text of ["Inspect Sump Pump", "Basement", "Overdue by 5 days", "Flush Water Heater", "Overdue by 2 days", "Due in 2 days", "Open HomeKeeper"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="http://localhost:3108/tasks"');
    expect(html).toContain('href="http://localhost:3108/settings#notifications"');
    expect(html).toContain("#2563EB");
    expect(html).toContain("Inter Tight");
  });

  it("renders completed work, integer-cent spend, upcoming tasks, and overdue tasks in a weekly summary", async () => {
    const html = await render(createElement(WeeklySummary, weeklyPreview));
    for (const text of ["Completed last week", "Oct 26", "Nov 1", "Clean Gutters", "$95.00", "$113.00", "Upcoming in the next 7 days", "Clean Range Hood Filter", "Overdue", "Inspect Sump Pump"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="http://localhost:3108/tasks"');
  });

  it("renders empty weekly sections and distinguishes unrecorded cost from zero cost", async () => {
    const empty = await render(createElement(WeeklySummary, {
      ...weeklyPreview,
      summary: { completed: [], spentCents: 0, upcoming: [], overdue: [] },
    }));
    expect(empty).toContain("No completed work was logged last week.");
    expect(empty).toContain("No upcoming maintenance.");
    expect(empty).toContain("Nothing overdue.");
    const text = await render(createElement(WeeklySummary, {
      ...weeklyPreview,
      summary: { ...weeklyPreview.summary, completed: [
        { id: "unknown", title: "Unrecorded cost", date: "2026-11-01", costCents: null },
        { id: "free", title: "Free task", date: "2026-11-01", costCents: 0 },
      ], spentCents: 0 },
    }), { plainText: true });
    expect(text).toContain("Free task\n\nNov 1 · $0.00");
    expect(text).toContain("Unrecorded cost\n\nNov 1\n");
  });

  it("escapes user content when rendered as HTML", async () => {
    const html = await render(createElement(TaskReminder, {
      ...reminderPreview,
      name: '<script>alert("name")</script>',
      tasks: [{ ...reminderPreview.tasks[0], title: '<img src=x onerror="alert(1)">' }],
    }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
  });
});
