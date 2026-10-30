# Lane D · Inventory

**Agent:** OpenCode · **Wave:** 2 · **Branch:** `lane/d`

## Owns
`app/(app)/inventory/**`, `app/ui/inventory/**`, `lib/actions/inventory.ts`, `test/inventory/**`,
`docs/screenshots/d/**`.

## Read first
`07-mutating-data.md`, `02-guides/forms.md`, `lib/data/items.ts`, `lib/validation/item.ts`, `app/ui/*`,
`docs/design/inventory.png`.

## Deliver
- `/inventory` per `inventory.png`: header + "Add Item"; category `FilterChips` (All Items, HVAC, Kitchen,
  Laundry, Exterior, Safety, plus Plumbing/Electrical/Roof only when items exist) via `?category=`; 3-column card grid
  (icon tile tinted by condition, name, model, "Installed 2019" + Good / Needs Service pill).
- Add/Edit Item modal (`?new=1` / `?edit=<id>`): name, model, category, installed year, condition, notes. Delete with confirm.
- Item detail (`?item=<id>`, side panel or modal): fields, linked tasks with status pills (links to
  `/tasks?edit=<id>`), log history with costs, and total cost.
- `lib/actions/inventory.ts`: `createItem`, `updateItem`, `deleteItem`; zod-validated, home-scoped,
  `revalidatePath` `/inventory` and `/home` (condition feeds Home Systems).
- Grid: 3 columns at 1440, 1 column at 390.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Filter, add, edit, and delete items; changing condition updates Home Systems on `/home`. Action tests against
`DATABASE_URL_TEST`. Screenshots at 1440 and 390.
