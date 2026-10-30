# Lane D1 · Data & auth core

**Agent:** Claude · **Wave:** 1 · **Branch:** `lane/d1`

## Owns
`lib/db/**`, `drizzle/**`, `lib/auth.ts`, `lib/auth-client.ts`, `lib/session.ts`, `lib/email.ts`, `lib/blob.ts`,
`lib/domain/**`, `lib/data/**`, `lib/validation/**`, `scripts/seed.ts`, `app/api/auth/**`, `app/api/upload/**`,
`proxy.ts`, `test/domain/**`, `test/data/**`, `test/validation/**`.
No UI. Don't touch `app/ui/**` or any page.

## Read first
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `15-route-handlers.md`, `06-fetching-data.md`;
Better Auth docs in `node_modules/better-auth` (Next.js integration, Drizzle adapter, `nextCookies` plugin,
`databaseHooks`, `sendResetPassword`); Drizzle `neon-http` driver docs; `@vercel/blob` client uploads
(`handleUpload`). Look at every `docs/design/*.png` for seed data.

## Deliver
1. **Schema** (`lib/db/schema.ts`, Drizzle + `drizzle-kit generate` migration in `drizzle/`), per the PLAN domain model:
   - Better Auth tables (`user`, `session`, `account`, `verification`) with user extras `phone`, `timeZone`
     (default `America/New_York`), `image`.
   - `home` (1 per user): `userId` unique, `address, homeType, yearBuilt, squareFeet, emailReminders (default true),
     weeklySummary (default false)`.
   - `item`: `homeId, name, model, category` enum (hvac|kitchen|laundry|exterior|safety|plumbing|electrical|roof),
     `installedYear, condition` enum (good|needs_service), `notes`.
   - `vendor`: `homeId, name, trade` enum (plumbing|electrical|hvac|landscaping|general), `phone, email,
     rating` (numeric 0–5, one decimal), `notes`.
   - `task`: `homeId, title, location, dueDate` (date), `recurrence` (jsonb `{every, unit}` or null),
     `itemId?, vendorId?, notes, completedAt?` (set when a **non-recurring** task is completed).
   - `logEntry`: `homeId, taskId?, title, date, costCents?, vendorId?, receiptUrl?, notes`.
   - `reminderSent`: `taskId, sentOn` (date), unique on both, for lane H's once-per-task-per-day rule.
   - All child rows `on delete cascade` from `home`/`user` so account deletion wipes everything.
   - `lib/db/index.ts` exports `db` (neon-http).
2. **Auth**: `lib/auth.ts` (Better Auth, email/password, Drizzle adapter, `nextCookies()`, user `additionalFields`
   for phone/timeZone, `databaseHooks.user.create.after` creates an empty `home`, `sendResetPassword` sends a simple
   HTML email through `lib/email.ts`); `lib/auth-client.ts` (`createAuthClient`); `app/api/auth/[...all]/route.ts`.
   `lib/email.ts` exports `sendEmail({to, subject, react?, html?, text?})` using Resend and `EMAIL_FROM`.
3. **Session**: `lib/session.ts` (server-only) exports `getSession()`, `requireSession()` (redirects to `/`),
   `getCurrentHome()` (session's home row + user; throws/redirects if missing).
4. **`proxy.ts`**: signed-out users on `/home`, `/tasks`, `/schedule`, `/inventory`, `/vendors`, `/settings` → `/`;
   signed-in users on `/` → `/home`. Use an optimistic cookie check (`getSessionCookie` from `better-auth/cookies`).
5. **Domain** (`lib/domain/*.ts`, pure, **test-first** in `test/domain/`): `taskStatus`, `dueText`
   ("Overdue by 2 days", "Due today", "Due in 3 days", "Due in 1 week", "Due in 5 weeks", "Completed Sep 28"),
   `nextDueDate`, `homeStats`, `healthScore` + `healthLabel`, `systemStatus` — exact rules in `docs/PLAN.md`.
   Also `todayIn(timeZone)` → `YYYY-MM-DD`.
6. **Reads** (`lib/data/*.ts`, `import "server-only"`, always scoped by the current home, typed return shapes,
   each row enriched with domain status where useful):
   `tasks.ts` (list with filters `{status?, q?}` + counts per status, `getTask(id)`, tasks in a date range for the
   calendar), `items.ts` (list by category, `getItem(id)` with linked tasks + log history + total cost),
   `vendors.ts` (list by trade/q with `lastHired` from log entries, `getVendor(id)`), `log.ts` (entries, spend this
   month), `home.ts` (home + user profile), `stats.ts` (`homeStats`, `healthScore`, `systemStatus` inputs computed).
   `reminders.ts` (cron-only, **not** session-scoped): homes with `emailReminders` or `weeklySummary`, their user's
   email/timeZone, due-soon/overdue tasks not yet in `reminderSent` for today, weekly summary data, `markReminderSent`.
7. **Validation** (`lib/validation/*.ts`, zod 4): `task`, `completeTask`, `logRepair`, `item`, `vendor`, `profile`,
   `homeDetails`, `notifications`, `changePassword`, `signUp`, `signIn`, `resetPassword`. Tests in `test/validation/`.
8. **Uploads**: `app/api/upload/route.ts` (`handleUpload`, signed-in only, images + PDF, ≤10 MB, pathname prefix
   `receipts/` or `avatars/`); `lib/blob.ts` re-exports a typed client helper `uploadFile(file, kind)` using
   `@vercel/blob/client` `upload()` and `deleteBlob(url)` (server).
9. **Seed** (`scripts/seed.ts`, `npm run db:seed`, idempotent: wipes and recreates the demo user):
   user Alex Morgan `alex.morgan@email.com` / password `homekeeper-demo`, phone (555) 123-4567, Eastern time;
   home 123 Maple St, Springfield · Single Family · 1998 · 2400 sq ft. The 12 tasks from `tasks.png` (2 overdue,
   3 due soon, 5 scheduled, 2 completed with log entries + costs), the 9 items from `inventory.png`, the 9 vendors from
   `vendors.png` (with log entries so "last hired" matches the months shown), dates relative to today. A few
   completed-this-month and last-month log entries so `homeStats` shows a positive delta and spend.
   Create the user through `auth.api.signUpEmail` so the password hash is right.

## Done when
- `npm test` green (domain + validation suites cover every rule in the PLAN).
- `npm run db:generate` produces a migration; with `.env.local` present, `npm run db:migrate` + `npm run db:seed` work
  and a test/script signs in as the seed user and reads their tasks via the data layer.
- `npm run lint && npm run build` green.
If `.env.local` doesn't exist yet, finish everything that doesn't need a database and list the DB checks still pending.
