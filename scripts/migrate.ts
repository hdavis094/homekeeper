// Applies the drizzle/ migrations to Neon during the Vercel production build (`vercel-build`), where
// the sensitive DATABASE_URL is readable. Locally, use `npm run db:migrate`.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  // Preview deployments share the production database, so only production builds migrate it.
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Skipping migrations: not a production build");
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  await migrate(drizzle({ client: neon(url) }), { migrationsFolder: "drizzle" });
  console.log("Migrations applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
