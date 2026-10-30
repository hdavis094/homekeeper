# Lane A checkpoint

Screenshots: `/`, `/signup`, and `/forgot-password`, each at 1440px and 390px, signed out.
Generated with:

```sh
node scripts/screenshot.mjs http://localhost:3101 docs/screenshots/a / /signup /forgot-password --signed-out
```

Implemented the welcome layout, anchor navigation, login, signup, reset request, and reset form, with shared
primitives and schemas. No Pricing link. The second how-it-works step describes manually adding a schedule,
rather than claiming automatic generation (not part of v1). Sign-out remains in the existing app layout;
password reset calls Better Auth sign-out internally to clear the invalidated browser cookie.

## Verification

- Sign-up through the browser sets cookies and redirects to `/home` (404 expected until Lane G).
- Wrong-password login shows an inline error, retains the email, and clears the password.
- Seed-user login through the browser redirects to `/home`.
- Better Auth API sign-out clears its cookies; signed-out `/tasks` redirects to `/`.
- Reset requests show the same inbox notice for existing and unknown emails.
- Reset request logs the email link with no Resend key configured.
- Following the logged link fails with `error=INVALID_TOKEN` due to the shared DB blocker below.
- Supplying that logged token directly to the reset form exercises the action successfully: returns to
  `/?reset=success`, displays the success notice, and clears an existing stale session cookie.
  The seed password was kept as `homekeeper-demo`.
- Seven action tests use the real auth API and an in-memory test DB, including validation, an empty home
  on signup, password replacement, one-time tokens, and session revocation.
- The final report contains the required lint/build/test output.

## Requests for orchestrator

Fix local PGlite sharing in `lib/db/index.ts` across Next.js server-component/action and API bundles.
The DB currently uses a module-local `instance`; separate runtime bundles appear to open independent
in-process clients over the same directory, which PGlite does not support. Consider a process-global
cached database/client, including hot-reload reuse, and verify it across all Next runtime contexts.
No shared files were changed by this lane.

Reproducer (start the seeded lane server first):

```sh
node test/auth/session-smoke.mjs http://localhost:3101
```

Observed output:

```text
PASS: server action redirects to /home and sets its session cookie
API can resolve action-created session: false
AssertionError: Shared DB blocker: API cannot see the action-created session
```

The reverse fails too: an API-created session resolves through `/api/auth/get-session`, but GET
`/?expired=1` renders the welcome page instead of server-side redirecting to `/home`. An API signup
accepted an email already created by the signup action, further demonstrating inconsistent DB views.
The reset token created by the action is likewise invisible to the API callback. These failures prevent
claiming end-to-end auth completion locally, despite passing per-worker DB tests. Re-run the smoke script
and the full logged-link reset flow after the shared fix. Recheck the existing shell's sign-out button
once the `/home` page is integrated.

## Final required checks

`npm run lint && npm run build && npm test` exited 0.

```text
> homekeeper@0.1.0 lint
> eslint
(no warnings or errors)

✓ Compiled successfully in 1528ms
Finished TypeScript in 3.2s
✓ Generating static pages using 10 workers (8/8) in 552ms
○ (Static) prerendered as static content
ƒ (Dynamic) server-rendered on demand

Test Files  13 passed (13)
Tests       220 passed (220)
Duration    7.23s
```
