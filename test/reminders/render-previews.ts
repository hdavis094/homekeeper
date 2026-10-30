// Run with: npx tsx test/reminders/render-previews.ts
import { mkdir, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { render } from "@react-email/components";
import TaskReminder from "@/emails/task-reminder";
import WeeklySummary from "@/emails/weekly-summary";
import { reminderPreview, weeklyPreview } from "./preview-data";

async function main() {
  const folder = "docs/screenshots/h";
  await mkdir(folder, { recursive: true });
  for (const [name, element] of [
    ["task-reminder", createElement(TaskReminder, reminderPreview)],
    ["weekly-summary", createElement(WeeklySummary, weeklyPreview)],
  ] as const) {
    const html = await render(element, { pretty: true });
    const path = `${folder}/${name}.html`;
    await writeFile(path, html);
    console.info(`Rendered ${path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
