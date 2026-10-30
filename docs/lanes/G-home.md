# Lane G · Home dashboard

**Agent:** Antigravity · **Wave:** 2 · **Branch:** `lane/g`

## Owns
`app/(app)/home/**`, `app/ui/home/**`, `test/home/**`, `docs/screenshots/g/**`. (Read-only lane: no actions file.)

## Read first
`06-fetching-data.md`, `02-guides/forms.md` (search form with `action="/tasks"`), `lib/data/stats.ts`,
`lib/data/tasks.ts`, `lib/domain/*`, `app/ui/*`, `docs/design/home.png`.

## Deliver
- `/home` per `home.png`: "Welcome back, {first name}" + "Here's what's happening with your home today.";
  header search (a GET form to `/tasks` with `q`), "+ Add Task" → `/tasks?new=1`, avatar.
- 4 `StatCard`s: Upcoming Tasks (next 30 days), Overdue ("Needs attention", red), Completed This Month
  ("+3 vs last month" and "$X spent"), Home Health Score ("92%" + label, blue).
- Upcoming Maintenance: 5 soonest open tasks as `ListRow`s (tinted tile, "location • due text", pill), "View all" → `/tasks`.
- Home Systems card: HVAC, Roof, Plumbing, Electrical with Good / Needs Attention dot pills from `systemStatus`.
- Quick Actions: Add Maintenance Task (`/tasks?new=1`), Log a Repair (`/tasks?log=1`), Set a Reminder
  (`/settings#notifications`), each with a colored square bullet.
- Empty states for a brand-new user (no tasks/items): friendly prompts linking to add task / add item.
- Layout: 4 stat columns + 2-column body at 1440; single column at 390.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Numbers match `homeStats`/`healthScore` on seed data (assert in a small test of any view-model helper you write);
layout matches `home.png`; screenshots at 1440 and 390.
