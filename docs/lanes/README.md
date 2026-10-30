# Lane protocol (read this first, every lane)

You are a helper agent building one **lane** of HomeKeeper. The full plan is `docs/PLAN.md`; your brief is
`docs/lanes/<id>.md`. Work only on what your brief lists.

## Assignment

| Lane | Agent | Wave |
|---|---|---|
| 0 · Setup | Claude (orchestrator) | 0 |
| D1 · Data & auth core | Claude | 1 |
| U1 · UI kit & shell | Antigravity | 1 |
| A · Auth & Welcome | Codex | 2 |
| B · Tasks | Claude | 2 |
| C · Schedule | Antigravity | 2 |
| D · Inventory | OpenCode | 2 |
| E · Vendors | OpenCode | 2 |
| F · Settings | Codex | 2 |
| G · Home | Antigravity | 2 |
| H · Reminders | Codex | 2 |
| 3 · Integration & ship (e2e suite by OpenCode, merge/review/deploy by Claude) | Claude + OpenCode | 3 |

## Rules

1. **Workspace.** You run in your own git worktree, created from the latest `main`. If the current branch isn't
   `lane/<id>` yet, run `git checkout -b lane/<id>` (example: `lane/d1`). Run `npm install` if `node_modules` is missing.
   Copy env vars if needed: `cp /home/hld/Projects/homekeeper/.env.local .env.local` (skip if that file doesn't exist yet).
2. **Read before coding.** `AGENTS.md` (this Next.js is 16.x, with breaking changes; read
   `node_modules/next/dist/docs/` pages before writing Next code), `docs/PLAN.md`, your brief, `docs/design/tokens.md`,
   and the `docs/design/*.png` exports your brief names.
3. **Ownership.** Only create or edit files in your brief's **Owns** list. `package.json` is frozen: all deps are installed.
   If you need a file you don't own (a missing query, primitive, or schema column), **stop and report it** in your
   final message under "Requests for orchestrator". Don't work around it by editing another lane's files.
4. **Test-first** for domain logic and validation. Server actions get Vitest tests against `DATABASE_URL_TEST`
   when it's set (skip them with `describe.skipIf(!process.env.DATABASE_URL_TEST)` otherwise).
5. **Commit small** on your lane branch with clear messages. **Never merge into `main`, push, or deploy.**
6. **Checkpoint.** When done, run `npm run lint && npm run build && npm test`. If your lane has UI, take screenshots
   at 1440px and 390px with Playwright (`npx playwright screenshot --viewport-size=1440,900 <url> <file>`), saving
   them to `docs/screenshots/<id>/` (that folder is yours). Then stop and reply with:
   - branch name and final commit SHA
   - the lint/build/test output (last lines)
   - what's done, what isn't, and any deviations from the brief
   - Requests for orchestrator (files outside your set you needed)

## Shared contracts

- Imports: `@/lib/db` (Drizzle `db`), `@/lib/db/schema`, `@/lib/session` (`getSession`, `requireSession`,
  `getCurrentHome`), `@/lib/data/*` (reads, server-only, scoped to the session's home), `@/lib/domain/*` (pure),
  `@/lib/validation/*` (zod), `@/app/ui/*` (primitives). Writes go in `lib/actions/<feature>.ts` (`"use server"`).
- Cross-lane navigation uses URL params only: `/tasks?new=1`, `/tasks?log=1`, `/tasks?edit=<id>`,
  `/tasks?status=overdue&q=…`, `/inventory?new=1`, `/vendors?new=1&trade=…&q=…`, `/schedule?month=2026-03&view=list`,
  `/settings#notifications`.
- Money is stored as integer cents (`costCents`); format with `Intl.NumberFormat("en-US", {style:"currency",currency:"USD"})`.
- Dates: `dueDate` / log `date` are calendar dates (`YYYY-MM-DD`, Postgres `date`). "Today" is computed in the
  user's `timeZone`.
