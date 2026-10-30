import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  // Under Vitest, always use the test branch so tests can never touch the real database.
  const url = process.env.VITEST ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      process.env.VITEST
        ? "DATABASE_URL_TEST is not set (DB tests should be skipped with describe.skipIf)"
        : "DATABASE_URL is not set. Pull env vars with `npx vercel env pull .env.local`.",
    );
  }
  return drizzle({ client: neon(url), schema });
}

export type Db = ReturnType<typeof createDb>;

let instance: Db | undefined;

/**
 * Drizzle over Neon's HTTP driver. Created on first use so builds and DB-less tests don't need
 * DATABASE_URL. neon-http has no interactive transactions: use `db.batch([...])` for atomic writes.
 */
export const db: Db = new Proxy({} as Db, {
  get(_, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
