# Lane E · Vendors

**Agent:** OpenCode · **Wave:** 2 · **Branch:** `lane/e`

## Owns
`app/(app)/vendors/**`, `app/ui/vendors/**`, `lib/actions/vendors.ts`, `test/vendors/**`, `docs/screenshots/e/**`.

## Read first
`07-mutating-data.md`, `02-guides/forms.md`, `lib/data/vendors.ts`, `lib/validation/vendor.ts`, `app/ui/*`,
`docs/design/vendors.png`.

## Deliver
- `/vendors` per `vendors.png`: header with `SearchInput` + "Add Vendor"; trade `FilterChips` (All Trades,
  Plumbing, Electrical, HVAC, Landscaping, General) via `?trade=`; 3-column cards: initials `Avatar`, name, trade
  pill, "★ 4.9 rating", phone, "Last hired: Jan 2026" (or "Never hired"), Contact button.
- Contact = `Menu` with "Call" (`tel:`) and "Email" (`mailto:`), each shown only if set.
- Add/Edit Vendor modal (`?new=1&trade=…` pre-selects the trade / `?edit=<id>`): name, trade, phone, email,
  rating (0–5, step 0.1), notes. Delete with confirm.
- `lib/actions/vendors.ts`: `createVendor`, `updateVendor`, `deleteVendor`; zod-validated, home-scoped,
  `revalidatePath` `/vendors`.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Filter, search, add, edit, and delete vendors; last hired comes from log entries. Action tests against
`DATABASE_URL_TEST`. Screenshots at 1440 and 390.
