# Lane A · Auth & Welcome

**Agent:** Codex · **Wave:** 2 · **Branch:** `lane/a`

## Owns
`app/page.tsx` (move it into `app/(marketing)/page.tsx`; delete the root one), `app/(marketing)/**`
(`/`, `/signup`, `/forgot-password`, `/reset-password`), `app/ui/auth/**`, `lib/actions/auth.ts`,
`test/auth/**`, `docs/screenshots/a/**`.

## Read first
`07-mutating-data.md`, `02-guides/forms.md` (in `node_modules/next/dist/docs/01-app/`), `16-proxy.md`,
`lib/auth.ts`, `lib/auth-client.ts`, `lib/validation/*`, `docs/design/welcome.png`.

## Deliver
- Landing per `welcome.png`: top nav (Features / How It Works anchor links, **no Pricing**, Get Started → /signup),
  hero (badge, 42/800 headline, copy, 3 checklist bullets, "Create free account" + "Already a member? Log in →"),
  login card (email, password, remember me, forgot password link, Log In, sign-up link), features band (4 cards),
  "How HomeKeeper works" (3 steps), dark footer (Privacy/Terms/Contact can be `#`).
- Login: server action (`auth.api.signInEmail` with `nextCookies`) or the auth client; errors shown inline with
  `FormError`; success → `/home`. Signed-in visitors to `/` → `/home` (proxy already does this; double-check server-side).
- `/signup` in the same card style: name, email, password, confirm → creates the user (D1's hook creates an empty
  home) → `/home`.
- `/forgot-password` (request email via Better Auth `requestPasswordReset`, always show "check your inbox") and
  `/reset-password?token=…` (new password + confirm → `/` with a success notice).
- `lib/actions/auth.ts`: `signIn`, `signUp`, `requestReset`, `resetPassword`. (Sign-out already lives in
  `app/(app)/layout.tsx`; don't add another.)
- Reset flow: call `requestPasswordReset({ email, redirectTo: "/reset-password" })` so the email link lands on
  `/reset-password?token=…`. `requireSession` redirects stale sessions to `/?expired=1`; show nothing special for it.
- Mobile (390px): single column, login card under the hero.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Sign up → lands on `/home`; sign out; log in; reset password via the email link; signed-out `/tasks` → `/`.
Action tests for validation failures. Screenshots of `/` and `/signup` at 1440 and 390.
