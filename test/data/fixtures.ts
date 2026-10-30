// Shared helpers for DB tests (any lane). Requires DATABASE_URL_TEST (lib/db uses it under Vitest).
//   describe.skipIf(!process.env.DATABASE_URL_TEST)("…", () => { … })
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import type { HomeScope } from "@/lib/data/scope";
import { db } from "@/lib/db";
import { home, user } from "@/lib/db/schema";
import { todayIn } from "@/lib/domain/dates";

export const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);

/** Signs up a throwaway user (the hook creates their empty home). Call `cleanup()` in afterAll. */
export async function createTestHome(options: { today?: string } = {}) {
  const email = `test-${randomUUID()}@homekeeper.test`;
  const { user: created } = await auth.api.signUpEmail({
    body: { name: "Test User", email, password: "test-password-123" },
  });
  const [row] = await db.select().from(home).where(eq(home.userId, created.id));
  if (!row) throw new Error("No home created for test user");
  const scope: HomeScope = { homeId: row.id, today: options.today ?? todayIn("America/New_York") };
  return {
    user: created,
    home: row,
    scope,
    cleanup: () => db.delete(user).where(eq(user.id, created.id)),
  };
}

/** Signs in through Better Auth and returns request headers carrying the session cookie. */
export async function signInHeaders(email: string, password: string): Promise<Headers> {
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}
