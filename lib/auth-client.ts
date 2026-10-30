import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

/** Browser-side Better Auth client (same origin, `/api/auth`). Prefer server actions + `auth.api` where possible. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } = authClient;
