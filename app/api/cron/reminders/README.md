# Reminder cron

`GET /api/cron/reminders` requires `Authorization: Bearer $CRON_SECRET`. Missing server configuration also returns 401. Vercel calls it daily at **13:00 UTC** via `vercel.json`; daylight saving changes its equivalent US local time. Monday and task cutoffs use each recipient's time zone, rather than the cron's UTC date.

Required environment: `DATABASE_URL`, `BETTER_AUTH_URL`, `CRON_SECRET`. Production email also needs `RESEND_API_KEY` and a suitable `EMAIL_FROM`.

- Daily reminders: one message per opted-in home containing open overdue tasks and tasks due today through three days ahead, excluding task/date pairs already recorded.
- Weekly summaries: independent opt-in; one message on local Monday, unless `lastWeeklySummaryOn` matches that local date. Includes completed work/spend for the preceding seven dates, open tasks due today through seven days ahead, and overdue tasks. Empty summaries still send.
- `?dryRun=1`: returns selected task details and weekly summary data without email or marker writes. It requires the same authorization as a real run.
- Successful non-dry runs record task/date and home/date markers. Without a Resend key, development runs log and record **simulated** deliveries, reported in `skippedEmails`. Production skips return 500 and leave markers unchanged.
- Email or marker failures are logged by home ID, return 500, and allow other messages to proceed. Successful messages retain their markers so a retry processes only outstanding work.

The response has `dryRun` and `counts`. `homesChecked` counts eligible homes; `reminderEmails`, `reminderTasks`, and `weeklySummaries` count selected work; `sentEmails` counts Resend sends; `skippedEmails` counts logged skips; `failedEmails` counts failed processing steps. Dry runs also include `deliveries`.

## Local verification

Use port 3108 and the per-worktree PGlite database. Stop Next before migrating or seeding, because PGlite permits one process per database directory.

```sh
npm run dev -- --port 3108
curl -H "Authorization: Bearer $CRON_SECRET" 'http://localhost:3108/api/cron/reminders?dryRun=1'
npm test -- test/reminders/
npx tsx test/reminders/render-previews.ts
```

The render script writes both templates to `docs/screenshots/h/`. `verification.json` in that directory records the seeded local HTTP checks. Pure tests cover calendar boundaries and Monday decisions; database tests cover preferences, time zones, repeat calls, weekly ranges, dry runs, failures/retries, and unconfigured email in production.

## Requests for orchestrator

The existing `lib/data/reminders.ts` contract is **read → send → mark**. Sequential repeated calls are covered, but two simultaneous invocations can both read eligible work before either marks it. A successful email followed by a failed marker write can also be sent again on retry. The weekly marker has the same limitation.

For stronger delivery guarantees, extend the shared data/email contracts with durable delivery claims and stable Resend idempotency keys (including retry-safe email payloads). This requires changes outside Lane H ownership, such as `lib/data/reminders.ts`, `lib/email.ts`, and potentially `lib/db/schema.ts` / migrations. No in-memory lock can cover separate Vercel instances.

References: [Vercel cron authorization, concurrency, and idempotency](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Resend with Next.js](https://resend.com/docs/send-with-nextjs), [React Email render](https://react.email/docs/utilities/render).
