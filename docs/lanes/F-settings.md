# Lane F · Settings

**Agent:** Codex · **Wave:** 2 · **Branch:** `lane/f`

## Owns
`app/(app)/settings/**`, `app/ui/settings/**`, `lib/actions/settings.ts`, `test/settings/**`,
`docs/screenshots/f/**`.

## Read first
`07-mutating-data.md`, `02-guides/forms.md`, `lib/auth.ts` (Better Auth `changePassword`, `updateUser`,
`deleteUser`), `lib/data/home.ts`, `lib/validation/*`, `lib/blob.ts`, `app/ui/*`, `docs/design/settings.png`.

## Deliver
- `/settings` per `settings.png`: left section nav (Profile, Home Details, Notifications, Security; **no Billing**)
  linking to `#profile`, `#home-details`, `#notifications`, `#security`, `#danger-zone` (sticky at 1440,
  horizontal scroll tabs at 390).
- Profile: `Avatar` + "Upload new photo" (Blob client upload to `avatars/`, then save URL on the user) and "Remove"
  (deletes the blob, clears the URL); full name, email (read-only in v1), phone, time zone (select of common IANA zones).
- Home Details: address, home type (Single Family / Townhouse / Condo / Apartment / Other), year built, square footage.
- Notifications (`id="notifications"`): Email Reminders and Weekly Summary toggles save immediately; Push
  Notifications and Vendor Recommendations shown **disabled with "Coming soon"**.
- Security: current + new password → Better Auth change password; **no 2FA row**.
- Danger Zone: "Delete Account" → confirm modal (`?delete=1`, type DELETE to confirm) → deletes the user (cascade
  removes all data; delete their avatar/receipt blobs best-effort) → signed out → `/`.
- `lib/actions/settings.ts`: `updateProfile`, `updateAvatar`, `removeAvatar`, `updateHome`,
  `updateNotifications`, `changePassword`, `deleteAccount`; each section shows a saved/error state.

## Wave 2 rules
You import from `lib/data`, `lib/domain`, `lib/validation`, `lib/session`, `lib/blob` and `app/ui` and **never edit them**.
Missing a query, column, or primitive? List it under "Requests for orchestrator" and stub around it locally in your
own files. Read the existing code in those folders first: it is the contract.

## Done when
Each section saves; the new avatar shows in the sidebar user card (after the orchestrator wires the layout, check
`revalidatePath("/", "layout")`); delete account removes all data and signs out. Action tests against
`DATABASE_URL_TEST`. Screenshots at 1440 and 390.
