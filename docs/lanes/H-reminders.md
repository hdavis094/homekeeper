# Lane H · Reminders (cron + email)

**Agent:** Codex · **Wave:** 2 · **Branch:** `lane/h`

## Owns
`app/api/cron/reminders/**`, `emails/**`, `vercel.json`, `test/reminders/**`.

## Read first
`15-route-handlers.md`, Vercel Cron docs (Authorization: `Bearer $CRON_SECRET`), `@react-email/components`,
`resend`, `lib/email.ts`, `lib/data/reminders.ts`, `lib/domain/*`.

## Deliver
- `emails/task-reminder.tsx` (tasks due in ≤3 days + overdue, each with due text, "Open HomeKeeper" button to
  `${BETTER_AUTH_URL}/tasks`) and `emails/weekly-summary.tsx` (completed last week + spend, upcoming next 7 days,
  overdue). Styled with the tokens (Inter Tight fallback to system sans, primary `#2563EB`).
- `app/api/cron/reminders/route.ts` (`GET`): 401 unless `authorization === \`Bearer ${CRON_SECRET}\``.
  For each home with `emailReminders`: compute "today" in the user's time zone, pick due-soon (≤3 days) and overdue
  open tasks not yet reminded today, send one email per home, then `markReminderSent`. On Mondays (user's time
  zone) also send the weekly summary to homes with `weeklySummary`. Return JSON counts. Keep it idempotent.
- Pure selection logic (which tasks to remind, is-it-Monday-there) in `app/api/cron/reminders/select.ts`,
  **test-first** in `test/reminders/`.
- `vercel.json`: `{"crons":[{"path":"/api/cron/reminders","schedule":"0 13 * * *"}]}` (daily, ~9am Eastern).
- Optional `?dryRun=1` returns what would be sent without sending.

## Wave 2 rules
Import from `lib/data/reminders.ts`, `lib/email.ts`, `lib/domain` and never edit them. Missing something? Report it.

## Done when
Calling the route locally with `CRON_SECRET` sends a Resend test email for the seed user (or `dryRun` shows it if
Resend isn't configured); wrong secret → 401; selection tests green.
