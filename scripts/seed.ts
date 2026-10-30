// `npm run db:seed`: recreate the demo user (alex.morgan@email.com / homekeeper-demo) and their data.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  // Imported after dotenv so DATABASE_URL / BETTER_AUTH_SECRET are set.
  const { seedDemo } = await import("../lib/db/seed");
  const { DEMO_USER } = await import("../lib/db/seed-data");
  const result = await seedDemo();
  console.log(
    `Seeded ${DEMO_USER.email} (today ${result.today}): ` +
      `${result.counts.tasks} tasks, ${result.counts.items} items, ` +
      `${result.counts.vendors} vendors, ${result.counts.log} log entries.`,
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
