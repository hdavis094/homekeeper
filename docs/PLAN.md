# HomeKeeper: orchestrator build plan

## Context

HomeKeeper is a home-maintenance tracker. The Penpot file ("New File 1") has 7 pages, one 1440px desktop board each:
**Welcome** (landing + login card), **Home** (dashboard), **Tasks**, **Schedule** (month calendar), **Inventory**, **Vendors**, **Settings**.
The repo is a fresh Next 16.3.8 / React 19 / Tailwind 4 scaffold with an uncommitted cleanup and a broken `app/ui/dashboard/sidenav.tsx`
(duplicate import, stray tags, missing `NavLinks`/`PowerIcon`); `nav-links.tsx` is empty.

I (orchestrator) split the build into waves. Inside a wave, helper bots work in parallel, each in its own git worktree,
owning a disjoint set of files and reading only the **contracts** produced by earlier waves. Every lane has a brief in
`docs/lanes/<id>.md` that a bot can pick up cold.

**Decisions made with the user**
- v1 = wireframe screens. Expenses = **cost on tasks**: completing a task or "Log a Repair" records cost, vendor, receipt. No Expenses page.
- Missing screens (Add Task/Item/Vendor, Log a Repair, Sign up, forgot password, details) → **bots design them in the wireframe's style** as modals/pages; reviewed at checkpoints.
- In v1: **email reminders** (+ weekly summary on the same cron), **profile photo upload**. Out: 2FA, push, vendor recommendations, Pricing/Billing (hide them, or show them disabled as "Coming soon").
- **Vercel only**: Neon Postgres (Vercel Marketplace), Vercel Blob, Vercel Cron, Resend (Marketplace) for email. No other services.

## Stack (fixed in Step 0, no lane may change it)

| Concern | Choice |
|---|---|
| Data | Neon Postgres + Drizzle ORM (`@neondatabase/serverless`, `drizzle-kit`) |
| Auth | Better Auth (email/password, Drizzle adapter, runs inside Next at `/api/auth/[...all]`), route guard in `proxy.ts` (Next 16 renamed middleware → proxy, see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) |
| Reads | Server Components call `lib/data/*` (server-only, always scoped to the session's home) |
| Writes | Server Actions in `lib/actions/*` with zod validation, `revalidatePath` (read `07-mutating-data.md`, `02-guides/forms.md`) |
| Files | Vercel Blob client uploads via one shared route |
| Email | Resend + React Email templates; Vercel Cron → `/api/cron/reminders` guarded by `CRON_SECRET` |
| Tests | Vitest (pure domain logic, actions with a test DB), Playwright (e2e at the end) |
| UI | Tailwind 4 tokens in `app/ui/globals.css`, Inter Tight via `next/font`, `clsx`, `lucide-react` icons |

Every bot reads `AGENTS.md` and the relevant `node_modules/next/dist/docs/` page **before** writing Next code.

## Design reference (from Penpot, so bots don't need the MCP)

The Penpot MCP is configured only for this folder. Worktrees live elsewhere, so lane bots **won't** have it. Step 0 exports every board to
`docs/design/<page>.png` and writes `docs/design/tokens.md` with:
- Colors: ink `#111827`, sidebar `#111827` / active item `#1F2937`, body bg `#F3F4F6`, card `#FFFFFF`, border `#E5E7EB` / divider `#F0F1F3`,
  muted text `#6B7280` / `#9CA3AF`, primary `#2563EB`.
- Status pills (fg/bg): overdue `#DC2626`/`#FEE2E2`, due soon `#D97706`/`#FEF3C7`, scheduled `#2563EB`/`#DBEAFE`, completed/good `#16A34A`/`#DCFCE7`.
- Type: Inter Tight. Page title 28–30/700, card title 15–16/700, body 13–14/400–500, pill 11–12/600, landing hero 42/800.
- Radii: inputs/buttons 8, cards 12, pills/chips 20. Layout: sidebar 240px, main padding 40px, card gap 20px.

Only the orchestrator (in this folder) uses the Penpot MCP, for visual review at checkpoints.

## Domain model (contract, written in Wave 1, lane D1)

- `user` + Better Auth tables (`session`, `account`, `verification`); user extras: `phone`, `timeZone`, `image` (Blob URL).
- `home` (one per user in v1): `address, homeType, yearBuilt, squareFeet`, notification prefs `emailReminders`, `weeklySummary`.
- `item` (inventory): `name, model, category (hvac|kitchen|laundry|exterior|safety|plumbing|electrical|roof), installedYear, condition (good|needs_service), notes`.
- `vendor`: `name, trade (plumbing|electrical|hvac|landscaping|general), phone, email, rating (0–5, user-entered), notes`. "Last hired" is derived from the latest log entry.
- `task`: `title, location, dueDate, recurrence ({every:n, unit:'day'|'week'|'month'|'year'} | null), itemId?, vendorId?, notes`.
- `logEntry` (completed work = expenses): `homeId, taskId?, title, date, costCents?, vendorId?, receiptUrl?, notes`.
  Completing a task creates a log entry and, if the task recurs, moves `dueDate` forward. "Log a Repair" creates a log entry with no task.

Pure functions in `lib/domain/` (test-first, no DB):
- `taskStatus(task, today)` → `overdue | due_soon (≤7 days) | scheduled | completed`, plus the "Overdue by 2 days / Due in 1 week" text.
- `nextDueDate(date, recurrence)`
- `homeStats(...)` → upcoming in 30 days, overdue, completed this month and delta vs last month, spend this month.
- `healthScore(...)` = 100 − 10·overdue − 5·items needing service, clamped 0–100. Labels: ≥85 "Looking good", ≥60 "Needs some attention", else "At risk".
- `systemStatus(items, tasks)` → HVAC / Roof / Plumbing / Electrical = Good or Needs Attention (worst of the category's items + overdue linked tasks).

## Routes

```
app/
├── (marketing)/page.tsx            /                Welcome landing + login card (signed-in → redirect /home)
├── (marketing)/signup, forgot-password, reset-password
├── (app)/layout.tsx                sidebar shell, requires session
├── (app)/home, tasks, schedule, inventory, vendors, settings
├── api/auth/[...all]/route.ts      Better Auth
├── api/upload/route.ts             Vercel Blob handleUpload (receipts, avatars)
└── api/cron/reminders/route.ts     daily reminders + Monday weekly summary
proxy.ts                            redirect signed-out users to /
```

Cross-lane links go through **URL params**, not shared components: `/tasks?new=1` opens Add Task, `/tasks?log=1` opens Log a Repair,
`/tasks?status=overdue&q=…` filters, `/inventory?new=1`, `/vendors?new=1&trade=…&q=…`, `/schedule?month=2026-03&view=list`.

## Waves and lanes

`[owner]` = the only lane allowed to write there. A lane that needs a file outside its set stops and asks the orchestrator.

### Step 0 · Setup (orchestrator + user, sequential)
- Commit the current WIP cleanup. Install **all** deps from the Stack table so no lane edits `package.json` later.
  Add `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts`, and `test`/`db:*` scripts.
- **User (human-in-loop):** `vercel link`, add Neon + Blob + Resend from the Vercel Marketplace, then `vercel env pull .env.local`.
  Orchestrator writes `.env.example` (`DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, BLOB_READ_WRITE_TOKEN, RESEND_API_KEY, CRON_SECRET, EMAIL_FROM`).
- Export Penpot boards → `docs/design/*.png`, write `docs/design/tokens.md`, `docs/PLAN.md` (this plan), and `docs/lanes/*.md` (one brief per lane below).
- **Checkpoint:** `npm run dev` serves a blank page; `npm test` runs 0 tests; `.env.local` present.

### Wave 1 · Contracts (2 bots in parallel)

| Lane | Owns | Delivers | Done when |
|---|---|---|---|
| **D1 · Data & auth core** | `lib/db/**`, `drizzle/**`, `lib/auth.ts`, `lib/auth-client.ts`, `lib/session.ts`, `lib/domain/**`, `lib/data/**`, `lib/validation/**`, `scripts/seed.ts`, `app/api/auth/**`, `app/api/upload/**`, `proxy.ts`, `test/domain/**` | Schema + migration on Neon; seed = the wireframe's data (Alex Morgan, 123 Maple St, 12 tasks, 9 items, 9 vendors, dates relative to today); Better Auth wired; `getCurrentHome()`; **all read queries** (`lib/data/tasks.ts`, `items.ts`, `vendors.ts`, `log.ts`, `home.ts`, `stats.ts`) with typed return shapes; zod schemas for every form; domain functions test-first | `npm test` green on `lib/domain`; `npm run db:seed` fills Neon; a script/test signs up a user and reads their seeded tasks |
| **U1 · UI kit & shell** | `app/ui/**` (except `app/ui/<feature>/` folders below), `app/layout.tsx`, `app/(app)/layout.tsx`, `app/ui/globals.css` | Tokens as Tailwind theme vars; fix/rebuild `SideNav` + `NavLinks` (active state via `usePathname`) + user card; primitives: `Button` (primary/secondary/ghost/danger), `StatusPill` (overdue/due_soon/scheduled/completed/good/needs_service/trade colors), `Card`, `StatCard`, `FilterChips` (URL-driven, with counts), `SearchInput` (URL-driven, debounced), `PageHeader`, `Field`/`Input`/`Select`/`Textarea`, `Toggle`, `Modal` (URL-driven, native `<dialog>`), `IconTile`, `Avatar` (initials fallback), `ListRow`, `EmptyState`, `FormError`; a dev-only `/kit` page that shows every primitive | `/kit` matches the pills, chips, buttons, and cards in `docs/design/*.png`; the sidebar matches at 1440px and collapses to a top bar under 768px; no data imports |

U1 uses **fake props only**. D1 doesn't touch UI. The only seam is the sign-out button, which U1 renders from a `signOut` server-action prop.

**Orchestrator checkpoint:** merge both, then review `/kit` against Penpot exports with the user.

### Wave 2 · Features (up to 7 bots in parallel)

Each lane owns `app/(app)/<route>/**` (or the listed pages), `app/ui/<feature>/**`, `lib/actions/<feature>.ts`, and `test/<feature>/**`.
They import from `lib/data`, `lib/domain`, `lib/validation`, and `app/ui` primitives, and never edit them. A missing query or primitive is requested from the orchestrator, who patches the Wave 1 code on `main` and tells the lanes to rebase.

| Lane | Screens | Includes | Done when |
|---|---|---|---|
| **A · Auth & Welcome** | `/`, `/signup`, `/forgot-password`, `/reset-password` | Landing per `welcome.png` (Pricing link hidden), login card, sign-up form in the same style creating user + empty home, password reset email via Resend, sign-out action | Sign up → lands on `/home`; log out; log in; reset password via email link; signed-out `/tasks` → `/` |
| **B · Tasks** | `/tasks` | Status chips with counts, search, list rows per `tasks.png`; Add/Edit Task modal (title, location, due date, recurrence, item, vendor, notes); **Complete** modal (date, cost, vendor, receipt upload); **Log a Repair** modal; delete | Every chip filter + search works on seed data; completing a recurring task logs cost and moves the due date; `?new=1` / `?log=1` open the modals |
| **C · Schedule** | `/schedule` | Month grid with colored task chips (overdue prefix), prev/next month, Month/List toggle, list view grouped by day; chip click → `/tasks?edit=<id>` | Seed tasks appear on the right days and in the right colors; month navigation and list view work |
| **D · Inventory** | `/inventory` | Category chips, card grid per `inventory.png`, Add/Edit Item modal, item detail panel (linked tasks, log history and total cost) | Filter, add, edit, and delete items; condition pill updates the Home Systems status |
| **E · Vendors** | `/vendors` | Trade chips, search, cards per `vendors.png` (initials avatar, trade pill, rating, phone, last hired); Contact = `tel:`/`mailto:` menu; Add/Edit Vendor modal | Filter, search, add, and edit vendors; last hired comes from log entries |
| **F · Settings** | `/settings` | Section nav; Profile (+ avatar upload/remove via Blob), Home Details, Notifications (push and vendor recommendations disabled "Coming soon"), Security (change password, no 2FA), Danger Zone delete account (confirm modal); Billing nav item hidden | Each section saves; avatar shows in the sidebar user card; delete account removes all data and signs out |
| **G · Home** | `/home` | Greeting, the 4 stat cards (Completed card also shows "$X spent"), Upcoming Maintenance (5 rows, View all → `/tasks`), Home Systems, Quick Actions (links to `/tasks?new=1`, `/tasks?log=1`, `/settings#notifications`), header search → `/tasks?q=` | Numbers match `homeStats`/`healthScore` on seed data; layout matches `home.png` |
| **H · Reminders** | `app/api/cron/reminders/**`, `emails/**`, `vercel.json` | Daily job: per home with `emailReminders`, email tasks due in ≤3 days and overdue ones (once per task per day); Monday weekly summary when `weeklySummary`; uses the user's time zone | Calling the route locally with `CRON_SECRET` sends a Resend test email for the seed user; wrong secret → 401 |

Suggested start order if bots are limited: **A** (unblocks real logins), then **B** (largest, and C/G link into it), then the rest.

**Checkpoint per lane:** bot reports `npm run lint && npm run build && npm test` output plus screenshots at 1440px and 390px.
Orchestrator compares them with the Penpot boards and merges.

### Wave 3 · Integration & ship (orchestrator, sequential)
1. Merge order A → B → C/D/E/F/G/H, then rebase; conflicts should only hit `docs/`.
2. Playwright e2e: sign up → add an item, a vendor, and a task → complete it with cost and receipt → see it on Home, Schedule, and Inventory → settings → delete account. Run at desktop and mobile widths.
3. Visual pass: each route next to its Penpot export (orchestrator uses the Penpot MCP).
4. Deploy: `vercel --prod`, run migrations on Neon prod, set the cron schedule, set the Resend sending domain.
   **User:** smoke-test sign-up on the production URL from their phone.

## How each lane bot works (in every brief)

- Start: `git worktree add ../homekeeper-<lane> -b lane/<lane>` from the latest `main`, then `npm install` and copy `.env.local`.
- Read: `AGENTS.md`, `docs/PLAN.md`, the lane brief, `docs/design/tokens.md`, the relevant `docs/design/*.png`, and the Next docs pages the brief names.
- Domain and validation logic test-first; actions get Vitest tests against a Neon branch (`DATABASE_URL_TEST`).
- Commit small. Never edit files outside the owned set. Stop at the checkpoint and report back; don't merge.

## On approval (this session)

1. Do Step 0: commit WIP, install deps, write configs, export Penpot PNGs + `tokens.md`, write `docs/PLAN.md` and the 11 lane briefs
   (`docs/lanes/0-setup.md, D1-data.md, U1-ui-kit.md, A-auth.md … H-reminders.md, 3-integration.md`).
2. Pause for the user's Vercel/Neon/Blob/Resend setup and `vercel env pull`.
3. Then dispatch Wave 1 (D1 and U1 as background agents in worktrees), and so on, wave by wave, with a user checkpoint between waves.

## Verification

- Ownership check: every path in Routes/Waves is owned by exactly one lane (grep the briefs' "Owns" lists for duplicates).
- Per lane: lint + build + tests green, screenshots compared with `docs/design/*.png`.
- End to end: Playwright suite green locally and against the Vercel preview; a reminder email arrives from the production cron run.
