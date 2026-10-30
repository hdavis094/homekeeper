# Lane B · Tasks

**Agent:** Claude · **Wave:** 2 · **Branch:** `lane/b`

## Owns
`app/(app)/tasks/**`, `app/ui/tasks/**`, `lib/actions/tasks.ts`, `test/tasks/**`, `docs/screenshots/b/**`.

## Read first
`07-mutating-data.md`, `09-revalidating.md`, `02-guides/forms.md`, `lib/data/tasks.ts`, `lib/domain/*`,
`lib/validation/task*.ts`, `lib/blob.ts`, `app/ui/*`, `docs/design/tasks.png`.

## Deliver
- `/tasks` per `tasks.png`: `PageHeader` with `SearchInput` + "Add Task"; `FilterChips` All / Overdue /
  Due Soon / Scheduled / Completed with counts (`?status=`); list rows (icon tile tinted by status, title,
  "location • due text", status pill), sorted overdue → due soon → scheduled → completed. Row click → `?edit=<id>`.
- Add/Edit Task modal (`?new=1` / `?edit=<id>`): title, location, due date, recurrence (none / every N
  days|weeks|months|years), linked item (select), vendor (select), notes. Delete with confirm.
- Complete modal (`?complete=<id>`): date (default today), cost, vendor, receipt upload (Blob, `receipts/`), notes.
  Completing creates a `logEntry`; recurring tasks move `dueDate` with `nextDueDate`, others get `completedAt`.
  The Neon HTTP driver has no transactions: write the log entry and the task update together with `db.batch([...])`.
  The log entry copies the task's `itemId` and `vendorId` (unless overridden); the new due date is
  `nextDueDate(dueDate, recurrence, completionDate)` from `lib/domain`.
- Log a Repair modal (`?log=1`): title, date, cost, vendor, item (optional), receipt, notes → log entry with no task.
- `lib/actions/tasks.ts`: `createTask`, `updateTask`, `deleteTask`, `completeTask`, `logRepair`; zod-validated,
  home-scoped, `revalidatePath` for `/tasks`, `/home`, `/schedule`, `/inventory`, `/vendors`.
- Empty state when no tasks match.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Every chip filter + search works on seed data; completing a recurring task logs cost and moves the due date;
`?new=1`, `?log=1`, `?edit=<id>` open the right modals. Action tests (create/complete-recurring/log repair)
against `DATABASE_URL_TEST`. Screenshots at 1440 and 390 (list + one modal).
