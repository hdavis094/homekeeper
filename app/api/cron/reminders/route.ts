import { createElement } from "react";
import TaskReminder from "@/emails/task-reminder";
import WeeklySummaryEmail from "@/emails/weekly-summary";
import {
  getTasksToRemind,
  getWeeklySummary,
  listReminderRecipients,
  markReminderSent,
  markWeeklySummarySent,
  type WeeklySummary,
} from "@/lib/data/reminders";
import { formatCents } from "@/lib/domain/format";
import { dueText } from "@/lib/domain/tasks";
import { sendEmail, type SendEmailInput } from "@/lib/email";
import { getReminderDay, selectTasksToRemind, shouldSendWeeklySummary } from "./select";

export const runtime = "nodejs";

type DeliveryPreview = {
  homeId: string;
  email: string;
  today: string;
  tasks: { id: string; title: string; dueDate: string; dueText: string }[];
  weeklySummary: WeeklySummary | null;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const now = new Date();
  const counts = {
    homesChecked: 0,
    reminderEmails: 0,
    reminderTasks: 0,
    weeklySummaries: 0,
    sentEmails: 0,
    skippedEmails: 0,
    failedEmails: 0,
  };
  const deliveries: DeliveryPreview[] = [];

  async function deliver(input: SendEmailInput, mark: () => Promise<void>) {
    if (dryRun) return;
    const result = await sendEmail(input);
    if (result.skipped) {
      counts.skippedEmails += 1;
      if (process.env.NODE_ENV === "production") {
        throw new Error("Email delivery is not configured; leaving delivery markers unchanged");
      }
    } else {
      counts.sentEmails += 1;
    }
    // Without Resend, non-dry runs log and record simulated deliveries for local repeat-call checks.
    // Use dryRun=1 to preview without changing either delivery marker.
    await mark();
  }

  try {
    const appUrl = process.env.BETTER_AUTH_URL;
    if (!appUrl) throw new Error("BETTER_AUTH_URL is not configured");
    const tasksUrl = new URL("/tasks", appUrl).toString();
    const preferencesUrl = new URL("/settings#notifications", appUrl).toString();
    const recipients = await listReminderRecipients();

    for (const recipient of recipients) {
      counts.homesChecked += 1;
      const day = getReminderDay(recipient.timeZone, now);
      const { today } = day;
      const preview: DeliveryPreview = {
        homeId: recipient.homeId,
        email: recipient.email,
        today,
        tasks: [],
        weeklySummary: null,
      };

      if (recipient.emailReminders) {
        try {
          // The read contract already excludes task/date markers recorded for this local date.
          const tasks = selectTasksToRemind(await getTasksToRemind(recipient.homeId, today), today);
          preview.tasks = tasks.map((task) => ({ id: task.id, title: task.title, dueDate: task.dueDate, dueText: dueText(task, today) }));
          if (tasks.length > 0) {
            counts.reminderEmails += 1;
            counts.reminderTasks += tasks.length;
            await deliver({
              to: recipient.email,
              subject: `HomeKeeper: ${tasks.length} maintenance task${tasks.length === 1 ? "" : "s"} need${tasks.length === 1 ? "s" : ""} attention`,
              react: createElement(TaskReminder, { name: recipient.name, today, tasks, appUrl }),
              text: [
                `Hi ${recipient.name},`,
                "Tasks overdue or due in the next 3 days:",
                ...tasks.map((task) => `${task.title}${task.location ? ` (${task.location})` : ""}: ${dueText(task, today)}`),
                `Open HomeKeeper: ${tasksUrl}`,
                `Manage notifications: ${preferencesUrl}`,
              ].join("\n"),
            }, () => markReminderSent(tasks.map((task) => task.id), today));
          }
        } catch (error) {
          counts.failedEmails += 1;
          console.error(`[reminders] Daily reminder failed for home ${recipient.homeId}`, error);
        }
      }

      if (shouldSendWeeklySummary(recipient, day)) {
        try {
          const summary = await getWeeklySummary(recipient.homeId, today);
          preview.weeklySummary = summary;
          counts.weeklySummaries += 1;
          await deliver({
            to: recipient.email,
            subject: "HomeKeeper: your weekly home summary",
            react: createElement(WeeklySummaryEmail, { name: recipient.name, today, summary, appUrl }),
            text: [
              `Hi ${recipient.name}, here's your weekly maintenance summary.`,
              `Completed last week: ${summary.completed.length} completed · ${formatCents(summary.spentCents)} spent`,
              ...summary.completed.map((entry) => `${entry.title}: ${entry.date}${entry.costCents === null ? "" : ` · ${formatCents(entry.costCents)}`}`),
              `Upcoming in the next 7 days: ${summary.upcoming.length}`,
              ...summary.upcoming.map((task) => `${task.title}: ${dueText(task, today)}`),
              `Overdue: ${summary.overdue.length}`,
              ...summary.overdue.map((task) => `${task.title}: ${dueText(task, today)}`),
              `Open HomeKeeper: ${tasksUrl}`,
              `Manage notifications: ${preferencesUrl}`,
            ].join("\n"),
          }, () => markWeeklySummarySent(recipient.homeId, today));
        } catch (error) {
          counts.failedEmails += 1;
          console.error(`[reminders] Weekly summary failed for home ${recipient.homeId}`, error);
        }
      }

      if (dryRun && (preview.tasks.length > 0 || preview.weeklySummary)) deliveries.push(preview);
    }
  } catch (error) {
    console.error("[reminders] Cron failed", error);
    return Response.json({ error: "Unable to process reminders", dryRun, counts }, { status: 500 });
  }

  return Response.json({ dryRun, counts, ...(dryRun ? { deliveries } : {}) }, { status: counts.failedEmails > 0 ? 500 : 200 });
}
