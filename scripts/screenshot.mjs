// Signed-in screenshots for lane checkpoints.
// Usage: node scripts/screenshot.mjs <baseUrl> <outDir> <path> [<path> ...]
//   e.g. node scripts/screenshot.mjs http://localhost:3102 docs/screenshots/b /tasks "/tasks?new=1"
// Signs in as the seed user (npm run db:seed), then saves <name>-1440.png and <name>-390.png per path.
// Pass --signed-out to skip signing in (for marketing pages).
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const signedOut = args.includes("--signed-out");
const [baseUrl, outDir, ...paths] = args.filter((a) => a !== "--signed-out");
if (!baseUrl || !outDir || paths.length === 0) {
  console.error("Usage: node scripts/screenshot.mjs <baseUrl> <outDir> <path> [...] [--signed-out]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: baseUrl });
if (!signedOut) {
  const res = await context.request.post("/api/auth/sign-in/email", {
    headers: { origin: baseUrl },
    data: { email: "alex.morgan@email.com", password: "homekeeper-demo" },
  });
  if (!res.ok()) throw new Error(`Sign-in failed: ${res.status()} ${await res.text()}`);
}
const page = await context.newPage();
for (const path of paths) {
  const name = path.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "") || "root";
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const file = `${outDir}/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
}
await browser.close();
