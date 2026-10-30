import { expect, test } from "@playwright/test";
import path from "node:path";

/** "2026-10-30" -> "2026-11" (the month a monthly task lands in after completing it on that date). */
function nextMonthParam(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

test("journey", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = "password123";

  // sign up
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Journey User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page).toHaveURL(/\/home/);

  // add item
  await page.goto("/inventory?new=1");
  await page.getByLabel("Name").fill("Test Item");
  await page.getByLabel("Model").fill("Model X");
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByText("Test Item")).toBeVisible();

  // add vendor
  await page.goto("/vendors?new=1");
  await page.getByLabel("Name").fill("Test Vendor");
  await page.getByRole("button", { name: "Add Vendor" }).click();
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.getByText("Never hired")).toBeVisible();

  // add a monthly task linked to the item and vendor
  await page.goto("/tasks?new=1");
  await page.getByLabel("Title").fill("Test Task");
  await page.getByLabel("Location").fill("Basement");
  const dueDate = await page.getByLabel("Due date").inputValue();
  await page.getByLabel("Repeats").selectOption("month");
  await page.getByLabel("Linked item").selectOption({ label: "Test Item" });
  await page.getByLabel("Vendor").selectOption({ label: "Test Vendor" });
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(page).toHaveURL(/\/tasks$/);

  // complete it with a cost and a receipt
  await page.getByText("Test Task").click();
  await page.getByRole("link", { name: "Mark Complete" }).click();
  await page.getByLabel("Cost").fill("10.50");
  await expect(page.getByLabel("Vendor")).toHaveValue(/.+/);
  // Without BLOB_READ_WRITE_TOKEN the upload fails with a friendly error; completion still works.
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "e2e/fixtures/receipt.png"));
  await expect(page.getByRole("button", { name: "Mark Complete" })).toBeEnabled({ timeout: 10_000 });
  await page.getByRole("button", { name: "Mark Complete" }).click();
  await expect(page).not.toHaveURL(/complete=/);

  // home: this month's spend includes the cost
  await page.goto("/home");
  await expect(page.getByText(/\$10\.50 spent/)).toBeVisible();

  // schedule: the next occurrence is one month out
  await page.goto(`/schedule?month=${nextMonthParam(dueDate)}&view=list`);
  await expect(page.getByText("Test Task").first()).toBeVisible();

  // inventory: the item's log history shows the completion
  await page.goto("/inventory");
  await page.getByText("Test Item").click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByText("Log history")).toBeVisible();
  await expect(detail.getByRole("link", { name: /Test Task/ })).toBeVisible(); // linked task
  await expect(detail.getByRole("paragraph").filter({ hasText: "Test Task" })).toBeVisible(); // log entry
  await expect(detail.getByText("Total: $10.50")).toBeVisible();

  // vendors: last hired is set
  await page.goto("/vendors");
  await expect(page.getByText(/Last hired: /)).toBeVisible();

  // settings: rename shows in the sidebar, weekly summary toggles
  await page.goto("/settings");
  await page.locator('input[name="name"]').fill("Journey User 2");
  await page.getByRole("button", { name: "Save Changes" }).first().click();
  await expect(page.getByRole("status").first()).toBeVisible();
  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue("Journey User 2");
  const weekly = page.getByRole("switch", { name: "Weekly Summary" });
  const before = await weekly.getAttribute("aria-checked");
  await weekly.click();
  await expect(weekly).not.toHaveAttribute("aria-checked", before ?? "");

  // delete account, then the credentials no longer work
  await page.goto("/settings?delete=1#danger-zone");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete Account" }).click();
  await expect(page).toHaveURL(/\/$/);
  const signIn = await page.request.post("/api/auth/sign-in/email", { data: { email, password } });
  expect(signIn.ok()).toBe(false);
});
