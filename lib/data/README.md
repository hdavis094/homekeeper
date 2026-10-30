# Data layer contract (lane D1)

- **Reads** (`lib/data/*`, server-only): call the session-scoped functions from Server Components:
  `listTasks({status,q})`, `getTask`, `listUpcomingTasks`, `listCalendarEntries(from,to)`, `listItems({category})`,
  `getItem`, `listItemOptions`, `listVendors({trade,q})`, `getVendor`, `listVendorOptions`, `listLogEntries`,
  `getSpendThisMonth`, `getDashboard`, `getHomeProfile`. Each has a `…For(scope, …)` twin taking
  `{ homeId, today }` for tests. `reminders.ts` is cron-only and not session-scoped.
- **Session**: `getCurrentHome()` → `{ home, user, today, timeZone }` (cached per request; redirects when signed out).
  Use `home.id` to scope every write: `where(and(eq(task.id, id), eq(task.homeId, home.id)))`.
- **Validation**: `parseForm(schema, formData)` → `{ success, data }` or `{ success: false, fieldErrors, formError? }`.
  Schemas output DB-ready shapes (`recurrence`, `costCents`, nulls for blanks).
- **Writes** (`lib/actions/<feature>.ts`): neon-http has no interactive transactions; use `db.batch([...])` when
  several statements must succeed together (e.g. completing a task: insert `logEntry` + update `task`).
- **Completing a task**: insert a `logEntry` with `taskId`, the task's `itemId`, `date`, `costCents`, `vendorId`,
  `receiptUrl`; then recurring → `dueDate = nextDueDate(task.dueDate, task.recurrence, date)`, one-off →
  `completedAt = date`. "Log a Repair" = a `logEntry` with no `taskId` (optional `itemId`).
- **Dates**: `dueDate`, `completedAt`, log `date` are `YYYY-MM-DD` strings. Compare with `today` from `getCurrentHome()`.
- **DB tests**: `describe.skipIf(!hasTestDb)` with helpers from `test/data/fixtures.ts`. Under Vitest `lib/db`
  connects to `DATABASE_URL_TEST`, never `DATABASE_URL`.
