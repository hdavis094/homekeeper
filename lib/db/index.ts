import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Local-only database: `pglite:memory` or `pglite:<dir>` (in-process Postgres, no server needed). */
export const PGLITE_PREFIX = "pglite:";

export function isPgliteUrl(url: string | undefined): url is string {
  return Boolean(url?.startsWith(PGLITE_PREFIX));
}

function createNeonDb(url: string) {
  return drizzle({ client: neon(url), schema });
}

export type Db = ReturnType<typeof createNeonDb>;

function createPgliteDb(url: string): Db {
  // Loaded lazily so production bundles never touch PGlite.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  /* eslint-enable @typescript-eslint/no-require-imports */
  const target = url.slice(PGLITE_PREFIX.length);
  const client = target === "memory" ? new PGlite() : new PGlite(target);
  const local = drizzlePglite({ client, schema });
  // Same query API as neon-http. PGlite has no `batch`; run the queries in order instead
  // (not atomic, which is fine for local development).
  const batch = async (queries: readonly PromiseLike<unknown>[]) => {
    const results: unknown[] = [];
    for (const query of queries) results.push(await query);
    return results;
  };
  return Object.assign(local, { batch }) as unknown as Db;
}

function createDb(): Db {
  // Under Vitest, always use the test database so tests can never touch the real one.
  const url = process.env.VITEST ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      process.env.VITEST
        ? "DATABASE_URL_TEST is not set (DB tests should be skipped with describe.skipIf)"
        : "DATABASE_URL is not set. Pull env vars with `npx vercel env pull .env.local`.",
    );
  }
  return isPgliteUrl(url) ? createPgliteDb(url) : createNeonDb(url);
}

let instance: Db | undefined;

/**
 * Drizzle over Neon's HTTP driver (or PGlite locally, see `isPgliteUrl`). Created on first use so
 * builds and DB-less tests don't need DATABASE_URL. neon-http has no interactive transactions:
 * use `db.batch([...])` for atomic writes.
 */
export const db: Db = new Proxy({} as Db, {
  get(_, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
