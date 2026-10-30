# Lane 0 · Setup (orchestrator, done)

**Agent:** Claude (orchestrator) · **Wave:** 0

Done in the orchestrator session:
- Committed the scaffold cleanup; `app/ui/dashboard/sidenav.tsx` and `nav-links.tsx` are compile-safe placeholders for U1.
- Installed every dependency in the stack table (`package.json` is now frozen for lanes).
- Added `vitest.config.mts` (Node env, `@/` paths, `server-only` stubbed, passes with no tests), `playwright.config.ts`
  (desktop 1440 + mobile 390 projects, `e2e/`), `drizzle.config.ts` (`lib/db/schema.ts` → `drizzle/`), scripts
  `test`, `test:watch`, `e2e`, `db:generate`, `db:migrate`, `db:studio`, `db:seed`.
- `.env.example`, `docs/design/*.png`, `docs/design/tokens.md`, `docs/lanes/*`.

**Still waiting on the user:** `npx vercel link`, add Neon + Blob + Resend from the Vercel Marketplace, set
`BETTER_AUTH_SECRET`, `CRON_SECRET`, `EMAIL_FROM` (and a Neon branch URL as `DATABASE_URL_TEST`), then
`npx vercel env pull .env.local`.
