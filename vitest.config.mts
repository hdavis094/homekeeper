import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside the react-server condition; tests run plain Node.
    alias: { "server-only": new URL("./test/server-only-stub.ts", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "lib/**/*.test.ts"],
    setupFiles: ["test/setup-db.ts"],
    passWithNoTests: true,
  },
});
