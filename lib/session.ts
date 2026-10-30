import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { home, type Home } from "@/lib/db/schema";
import { DEFAULT_TIME_ZONE, todayIn } from "@/lib/domain/dates";

/** The signed-in session (user + session), or null. Cached per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type SessionUser = Session["user"];

/**
 * The session, or redirect to `/` when signed out. `?expired=1` tells the proxy not to bounce a
 * stale session cookie straight back to `/home` (which would loop).
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/?expired=1");
  return session;
}

export type CurrentHome = {
  home: Home;
  user: SessionUser;
  /** Today's date (YYYY-MM-DD) in the user's time zone. */
  today: string;
  timeZone: string;
};

/**
 * The signed-in user's home (redirects to `/` when signed out). The sign-up hook creates the home;
 * if it's somehow missing, it's created here so pages never crash. Cached per request.
 */
export const getCurrentHome = cache(async (): Promise<CurrentHome> => {
  const { user } = await requireSession();
  let [row] = await db.select().from(home).where(eq(home.userId, user.id)).limit(1);
  if (!row) {
    await db.insert(home).values({ userId: user.id }).onConflictDoNothing();
    [row] = await db.select().from(home).where(eq(home.userId, user.id)).limit(1);
    if (!row) throw new Error(`No home for user ${user.id}`);
  }
  const timeZone = user.timeZone || DEFAULT_TIME_ZONE;
  return { home: row, user, today: todayIn(timeZone), timeZone };
});
