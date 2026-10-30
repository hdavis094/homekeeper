import { expect, test } from "@playwright/test";

test("sign up fresh user lands on /home", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page).toHaveURL(/\/home/);
});

test("sign out then sign in", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page).toHaveURL(/\/home/);

  // sign out (mobile needs menu toggle first)
  const menuToggle = page.getByRole("button", { name: "Toggle navigation menu" });
  if (await menuToggle.isVisible()) await menuToggle.click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  // sign in
  await page.goto("/#login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/home/);
});

test("signed-out /tasks redirects to /", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/$/);
});