import "server-only";
import { getCurrentHome } from "@/lib/session";

/**
 * Every read is scoped to one home. Pages call the session-scoped functions (e.g. `listTasks()`),
 * which resolve the scope from the signed-in user; the `…For(scope, …)` variants take it explicitly
 * (tests, cron).
 */
export type HomeScope = {
  homeId: string;
  /** Today (YYYY-MM-DD) in the user's time zone; drives every status. */
  today: string;
};

export async function currentScope(): Promise<HomeScope> {
  const { home, today } = await getCurrentHome();
  return { homeId: home.id, today };
}

/** Escapes `%`, `_` and `\` for ILIKE, and wraps in wildcards. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
