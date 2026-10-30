# Lane F checkpoint

Branch: `lane/f`. Implementation commits: `a3f894e`, `2f290d9`.

Implemented `/settings`, all seven requested server actions, and nine unconditional action integration tests against in-memory PGlite. Only lane-owned repository paths changed; dependencies and shared contracts are unchanged.

## Delivered

- Sticky desktop section navigation and horizontally scrolling mobile links, including Danger Zone.
- Profile and home forms with field errors, pending states, and saved messages. Email is read-only. Common IANA zones include the current zone when it is outside the common list.
- Avatar client upload to `avatars/`, user-prefixed filenames, URL validation, removal, and best-effort cleanup. Profile updates invalidate the root layout for sidebar refresh.
- Immediate email/weekly preference saves. Push notifications and vendor recommendations are disabled and marked Coming soon.
- Better Auth password changes preserve the current session.
- URL-driven `?delete=1` native modal, focus containment, confirmation field focus, exact DELETE confirmation, cascade deletion through Better Auth, best-effort receipt/avatar cleanup, and redirect to `/`.
- No Billing or 2FA UI.

## Checks

The final required sequence `npm run lint && npm run build && npm test` passed:

```text
> homekeeper@0.1.0 lint
> eslint
(no warnings or errors)

✓ Compiled successfully
✓ Generating static pages using 8 workers (6/6) in 480ms
ƒ /settings
ƒ (Dynamic) server-rendered on demand

Test Files  13 passed (13)
     Tests  222 passed (222)
  Duration  7.49s
```

An earlier full-suite attempt timed out in the shared `test/setup-db.ts` 10-second migration hook. The unchanged command passed on the final run; no tests were skipped on that run.

Signed-in browser checks verified profile/name/phone/time-zone persistence after reload, sidebar name/address refresh, home validation and saving, notification autosave, disabled Coming soon controls, and the friendly upload failure without Blob credentials. Mobile checks confirmed no horizontal page overflow, scrolling section tabs, and a native modal that focuses confirmation and disables deletion until DELETE is entered.

The nine Settings action tests additionally verify password credential changes while preserving the current session, avatar save/remove, authentication for every action, cross-account isolation, recent-session deletion restrictions, and cascade removal of the home, items, vendors, tasks, logs, reminders, credentials, and sessions. Blob cleanup failure does not block deletion.

Screenshots were captured with the exact requested script:

```sh
node scripts/screenshot.mjs http://localhost:3106 docs/screenshots/f /settings "/settings?delete=1"
```

- [Settings, 1440px](settings-1440.png)
- [Settings, 390px](settings-390.png)
- [Delete confirmation, 1440px](settings-delete-1-1440.png)
- [Delete confirmation, 390px](settings-delete-1-390.png)

## Not verified / deviations

Actual Blob storage upload and deletion require the absent local token. The friendly failure is verified; avatar state changes and cleanup are covered by action tests with the external Blob API mocked.

The final live password-change/delete-account browser smoke could not be completed because of the shared file-backed PGlite problem below. These flows pass at the action boundary against the in-memory test database. Do not interpret passing action tests as a complete browser integration pass.

A lane-local native dialog is used instead of the shared Modal primitive because the primitive renders `open` before its effect checks `!dialog.open` to call `showModal()`. The local dialog supplies the required modal behavior and URL contract without editing the shared component.

## Requests for orchestrator

1. **Fix `lib/db/index.ts` PGlite client sharing/lifecycle before integration.** Its module-local lazy instance is instantiated independently by Next's auth route and app/action bundles. Reproduction: sign in, load Settings, save a profile, then query `/api/auth/get-session`; the page/layout show the new profile while the auth route returns the old one. A second API sign-in after the app bundle has initialized returns 200, but `/settings` redirects to `/?expired=1` because its connection cannot see the new session. Restarting then produced `RuntimeError: Aborted(). Build with -sASSERTIONS for more info.` on user/session queries and even `npm run db:seed`. This repeated with a newly migrated/seeded database. Share one file-backed PGlite client across bundles/HMR or supply an appropriate local database connection strategy, then rerun password change, re-login, and account deletion in the browser. No shared file was modified to work around this.
2. **Repair `app/ui/modal.tsx`** so `showModal()` actually runs before the dialog is opened; then the local delete dialog can be replaced with the shared primitive if desired.

The dev server is stopped. The final local `.pglite/dev` database was recreated, migrated, and seeded. Failed local databases are preserved under ignored `.pglite/dev-before-settings-check` and `.pglite/dev-after-settings-screenshots` for diagnosis.
