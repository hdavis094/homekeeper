# Lane protocol (read this first, every lane)

You are a helper agent building one **lane** of HomeKeeper. The full plan is `docs/PLAN.md`; your brief is
`docs/lanes/<id>.md`. Work only on what your brief lists.

## Assignment

| Lane | Agent | Wave | Dev port |
|---|---|---|---|
| 0 · Setup | Claude (orchestrator) | 0 | – |
| D1 · Data & auth core | Claude | 1 | – |
| U1 · UI kit & shell | Antigravity | 1 | – |
| A · Auth & Welcome | Codex | 2 | 3101 |
| B · Tasks | Claude | 2 | 3102 |
| C · Schedule | Antigravity | 2 | 3103 |
| D · Inventory | OpenCode | 2 | 3104 |
| E · Vendors | OpenCode | 2 | 3105 |
| F · Settings | Codex | 2 | 3106 |
| G · Home | Antigravity | 2 | 3107 |
| H · Reminders | Codex | 2 | 3108 |
| 3 · Integration & ship (e2e suite by OpenCode, merge/review/deploy by Claude) | Claude + OpenCode | 3 | – |

## Rules

1. **Workspace.** You run in your own git worktree, created from the latest `main`. If the current branch isn't
   `lane/<id>` yet, run `git checkout -b lane/<id>` (example: `lane/d1`). Run `npm install` if `node_modules` is missing.
   Copy env vars: `cp /home/hld/Projects/homekeeper/.env.local .env.local`.
2. **Local database (no Neon needed).** `.env.local` points at PGlite, an in-process Postgres:
   `DATABASE_URL=pglite:./.pglite/dev` (per worktree) and `DATABASE_URL_TEST=pglite:memory` (fresh per Vitest
   worker, migrations applied automatically). First run: `mkdir -p .pglite && npm run db:migrate && npm run db:seed`.
   Seed login: `alex.morgan@email.com` / `homekeeper-demo`. PGlite allows **one process per database dir**: stop
   your dev server before re-seeding. Run the dev server on your lane's port (see Assignment) and set
   `BETTER_AUTH_URL=http://localhost:<port>` in your `.env.local` to match. Code must stay driver-agnostic:
   import `db` from `@/lib/db`, never PGlite directly. DB tests should run unconditionally (env is always set).
3. **Read before coding.** `AGENTS.md` (this Next.js is 16.x, with breaking changes; read
   `node_modules/next/dist/docs/` pages before writing Next code), `docs/PLAN.md`, your brief, `docs/design/tokens.md`,
   and the `docs/design/*.png` exports your brief names.
4. **Ownership.** Only create or edit files in your brief's **Owns** list. `package.json` is frozen: all deps are installed.
   If you need a file you don't own (a missing query, primitive, or schema column), **stop and report it** in your
   final message under "Requests for orchestrator". Don't work around it by editing another lane's files.
5. **Test-first** for domain logic and validation. Server actions get Vitest tests against `DATABASE_URL_TEST`
   when it's set (skip them with `describe.skipIf(!process.env.DATABASE_URL_TEST)` otherwise).
6. **Commit small** on your lane branch with clear messages. **Never merge into `main`, push, or deploy.**
7. **Checkpoint.** When done, run `npm run lint && npm run build && npm test`. If your lane has UI, take signed-in screenshots
   at 1440px and 390px with `node scripts/screenshot.mjs http://localhost:<port> docs/screenshots/<id> /route "/route?new=1"`
   (add `--signed-out` for marketing pages; `npx playwright install chromium` if browsers are missing).
   `docs/screenshots/<id>/` is yours. Then stop and reply with:
   - branch name and final commit SHA
   - the lint/build/test output (last lines)
   - what's done, what isn't, and any deviations from the brief
   - Requests for orchestrator (files outside your set you needed)

## Shared contracts

- Schema notes: `logEntry.itemId` exists (log a repair against an item); `task.completedAt` is a date.
  `lib/data/README.md` is the read-layer contract. `test/data/fixtures.ts` has `createTestHome()` / `signInHeaders()`.
- Imports: `@/lib/db` (Drizzle `db`), `@/lib/db/schema`, `@/lib/session` (`getSession`, `requireSession`,
  `getCurrentHome`), `@/lib/data/*` (reads, server-only, scoped to the session's home), `@/lib/domain/*` (pure),
  `@/lib/validation/*` (zod), `@/app/ui/*` (primitives). Writes go in `lib/actions/<feature>.ts` (`"use server"`).
- Cross-lane navigation uses URL params only: `/tasks?new=1`, `/tasks?log=1`, `/tasks?edit=<id>`,
  `/tasks?status=overdue&q=…`, `/inventory?new=1`, `/vendors?new=1&trade=…&q=…`, `/schedule?month=2026-03&view=list`,
  `/settings#notifications`.
- No Vercel services locally yet: without `BLOB_READ_WRITE_TOKEN` uploads fail, so receipt/avatar upload must be
  optional and show a friendly error; without `RESEND_API_KEY`, `sendEmail` logs and skips. Don't block on either.
- Money is stored as integer cents (`costCents`); format with `Intl.NumberFormat("en-US", {style:"currency",currency:"USD"})`.
- Dates: `dueDate` / log `date` are calendar dates (`YYYY-MM-DD`, Postgres `date`). "Today" is computed in the
  user's `timeZone`.
