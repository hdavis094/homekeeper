import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL!;
// `pglite:<dir>` = local in-process Postgres (see lib/db/index.ts).
const pglite = url?.startsWith("pglite:") ? url.slice("pglite:".length) : null;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(pglite ? { driver: "pglite", dbCredentials: { url: pglite } } : { dbCredentials: { url } }),
});
