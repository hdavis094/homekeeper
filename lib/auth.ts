import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { DEFAULT_TIME_ZONE } from "@/lib/domain/dates";
import { sendEmail } from "@/lib/email";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Better Auth (email + password). Server code calls `auth.api.*` (e.g. `signInEmail`, `signUpEmail`,
 * `changePassword`, `updateUser`, `deleteUser`, `requestPasswordReset`, `resetPassword`) with
 * `headers: await headers()`; `nextCookies()` sets the session cookie from Server Actions.
 */
export const auth = betterAuth({
  appName: "HomeKeeper",
  // BETTER_AUTH_URL is the canonical origin; also accept this deployment's own Vercel URLs (previews).
  trustedOrigins: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const name = escapeHtml(user.name.split(" ")[0] || "there");
      await sendEmail({
        to: user.email,
        subject: "Reset your HomeKeeper password",
        html: `<div style="font-family:'Inter Tight',system-ui,sans-serif;color:#111827;max-width:480px">
<p>Hi ${name},</p>
<p>We got a request to reset your HomeKeeper password. This link works for the next hour.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2563EB;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
<p style="color:#6B7280;font-size:13px">If you didn't ask for this, you can ignore this email.</p>
</div>`,
        text: `Hi ${user.name.split(" ")[0] || "there"},\n\nReset your HomeKeeper password: ${url}\n\nIf you didn't ask for this, you can ignore this email.`,
      });
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      timeZone: { type: "string", required: false, defaultValue: DEFAULT_TIME_ZONE },
    },
    deleteUser: { enabled: true },
  },
  databaseHooks: {
    user: {
      create: {
        // Every user gets one (empty) home. Deleting the user cascades to it and all its data.
        after: async (created) => {
          await db.insert(schema.home).values({ userId: created.id }).onConflictDoNothing();
        },
      },
    },
  },
  // Must stay last.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
