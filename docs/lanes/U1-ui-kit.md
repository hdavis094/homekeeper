# Lane U1 · UI kit & shell

**Agent:** Antigravity · **Wave:** 1 · **Branch:** `lane/u1`

## Owns
`app/ui/**` (except the feature folders `app/ui/{auth,tasks,schedule,inventory,vendors,settings,home}/`),
`app/layout.tsx`, `app/(app)/layout.tsx`, `app/ui/globals.css`, `app/kit/**` (dev-only page), `docs/screenshots/u1/**`.
Don't touch `app/page.tsx`: lane A owns `/`.

## Read first
`node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `04-linking-and-navigating.md`,
`05-server-and-client-components.md`, `11-css.md`, `13-fonts.md`; `docs/design/tokens.md`; **all** `docs/design/*.png`.

## Deliver
- `globals.css`: Tailwind 4 `@theme` tokens (colors, radii, font) from `tokens.md`; Inter Tight via `next/font`
  wired in `app/layout.tsx` (metadata title "HomeKeeper"). Remove the dark-mode block (light only in v1).
- **Shell**: `app/ui/dashboard/sidenav.tsx` + `nav-links.tsx` (rebuild the placeholders) matching the sidebar in
  every app board: logo, 6 nav items (Home, Tasks, Schedule, Inventory, Vendors, Settings) with active state via
  `usePathname`, user card at the bottom (`Avatar`, name, address), and a sign-out button. `SideNav` props:
  `{ user: { name: string; address: string | null; image: string | null }, signOut: () => Promise<void> }`
  (signOut is a server action passed in; render it as `<form action={signOut}>`). Under 768px it becomes a top bar
  with a menu toggle.
- `app/(app)/layout.tsx`: sidebar + main (`bg` body, 40px padding). In Wave 1 pass **fake props** (Alex Morgan,
  123 Maple St., no-op signOut) with a `// TODO(orchestrator): wire session + signOut` comment. No data imports.
- **Primitives** (one file each in `app/ui/`, typed props, server components unless they need state):
  `Button` (primary/secondary/ghost/danger, sizes, renders `<Link>` when `href` given), `StatusPill`
  (overdue/due_soon/scheduled/completed/good/needs_service/needs_attention + trades; optional dot),
  `Card`, `StatCard` (label, value, sublabel, tone), `FilterChips` (URL-driven: `param`, options
  `{value,label,count?}`, preserves other params), `SearchInput` (URL-driven, debounced 300ms, `param` default `q`),
  `PageHeader` (title, subtitle, actions slot), `Field` / `Input` / `Select` / `Textarea` (label, error),
  `Toggle` (accessible switch, `disabled` + "Coming soon" hint), `Modal` (native `<dialog>`, URL-driven: opens when a
  search param is present, closing removes it; title, footer slot), `IconTile` (tone), `Avatar` (image or initials),
  `ListRow` (icon tile, title, meta, trailing slot, optional href/onClick), `EmptyState`, `FormError`,
  `Menu` (small popover menu for "Contact"), and `app/ui/index.ts` re-exporting all of them.
- `app/kit/page.tsx`: dev-only showcase of every primitive and variant (return `notFound()` in production).

## Done when
`/kit` matches the pills, chips, buttons, cards, toggles, and inputs in `docs/design/*.png`; the sidebar matches at
1440px and collapses under 768px; no imports from `lib/`; lint + build green; screenshots of `/kit` and the shell at
1440 and 390 in `docs/screenshots/u1/`.
