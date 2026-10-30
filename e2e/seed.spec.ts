import { expect, test, type Page } from "@playwright/test";

async function signInSeed(page: Page) {
  await page.goto("/#login");
  await page.getByLabel("Email").fill("alex.morgan@email.com");
  await page.getByLabel("Password", { exact: true }).fill("homekeeper-demo");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/home/);
}

test("seed tasks chip counts", async ({ page }) => {
  await signInSeed(page);
  await page.goto("/tasks");
  const group = page.getByRole("group", { name: "Filter options" });
  await expect(group.getByRole("button", { name: "All 12" })).toBeVisible();
  await expect(group.getByRole("button", { name: "Overdue 2" })).toBeVisible();
  await expect(group.getByRole("button", { name: "Due Soon 3" })).toBeVisible();
  await expect(group.getByRole("button", { name: "Scheduled 5" })).toBeVisible();
  await expect(group.getByRole("button", { name: "Completed 2" })).toBeVisible();
});

test("seed home stat cards", async ({ page }) => {
  await signInSeed(page);
  await page.goto("/home");
  const stats = page.getByRole("region", { name: "Home summary statistics" });
  await expect(stats.getByText("Upcoming Tasks")).toBeVisible();
  await expect(stats.getByText("Overdue")).toBeVisible();
  await expect(stats.getByText("Completed This Month")).toBeVisible();
  await expect(stats.getByText("Home Health Score")).toBeVisible();
});