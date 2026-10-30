// With DATABASE_URL_TEST=pglite:memory every Vitest worker gets a fresh in-memory Postgres;
// apply the migrations before any test touches it.
import { beforeAll } from "vitest";
import { db, isPgliteUrl } from "@/lib/db";

beforeAll(async () => {
  if (!isPgliteUrl(process.env.DATABASE_URL_TEST)) return;
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "drizzle" });
});
