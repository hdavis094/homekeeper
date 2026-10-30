# Wave 3 · Integration & ship

**Agents:** Claude (orchestrator: merge, review, deploy) + OpenCode (e2e suite, lane `lane/e2e`)

## Orchestrator (Claude), sequential
1. Merge order A → B → C/D/E/F/G/H into `main`, resolving conflicts (should only hit `docs/`). After Wave 1, wire
   `app/(app)/layout.tsx` to the session (`getCurrentHome`) and lane A's `signOut`.
2. Visual pass: each route next to its Penpot board (Penpot MCP), fix drift or hand it back to the lane.
3. Deploy: `npx vercel --prod`, `npm run db:migrate` against Neon prod, confirm the cron in the Vercel dashboard,
   set up the Resend sending domain and `EMAIL_FROM`.
4. **User:** smoke-test sign-up on the production URL from a phone.

## E2E lane (OpenCode)

**Owns:** `e2e/**`, `docs/screenshots/e2e/**`.

Playwright suite (`npm run e2e`, desktop 1440 + mobile 390 projects already configured):
1. `auth.spec.ts`: sign up a fresh user (unique email) → lands on `/home`; sign out; sign in; signed-out `/tasks` → `/`.
2. `journey.spec.ts`: add an item, a vendor, and a recurring task → complete it with a cost and a receipt
   (fixture image in `e2e/fixtures/`) → see it on Home (spend), Schedule (next due date), Inventory (item log
   history), Vendors (last hired) → Settings: toggle weekly summary, change name → delete account → back on `/`.
3. `seed.spec.ts`: sign in as the seed user, check chip counts on `/tasks` (All 12 / Overdue 2 / Due Soon 3 /
   Scheduled 5 / Completed 2) and the four stat cards on `/home`.
Prefer role/label locators. Run against local dev and against the Vercel preview (`PLAYWRIGHT_BASE_URL`).

**Done when:** suite green on both projects locally and against the preview.
