# Lane C · Schedule

**Agent:** Antigravity · **Wave:** 2 · **Branch:** `lane/c`

## Owns
`app/(app)/schedule/**`, `app/ui/schedule/**`, `test/schedule/**`, `docs/screenshots/c/**`.
(Read-only lane: no actions file.)

## Read first
`06-fetching-data.md`, `lib/data/tasks.ts` (date-range query), `lib/domain/*`, `app/ui/*`, `docs/design/schedule.png`.

## Deliver
- `/schedule?month=YYYY-MM` (default: current month in the user's time zone) per `schedule.png`: header with
  ‹ / › month links and "March 2026" label, Month/List segmented toggle (`?view=list`).
- Month grid: SUN–SAT header, 5–6 week rows, day numbers, task chips colored by status; overdue chips prefixed
  "Overdue: "; more than 3 chips → "+N more". Completed tasks show on their completion date (from log entries) in green.
  Chip click → `/tasks?edit=<id>`.
- List view: tasks in the month grouped by day (date heading + `ListRow`s).
- Pure calendar helpers (month matrix, month param parsing, prev/next) in `app/ui/schedule/calendar.ts`,
  **test-first** in `test/schedule/`.
- Mobile (390px): list view by default, or a compact grid with dots.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Seed tasks appear on the right days in the right colors; month navigation and list view work; tests green;
screenshots at 1440 and 390.
