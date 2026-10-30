// Ids arrive via URL params (?edit=, ?item=); a malformed one must read as "not found", not crash.
import { describe, expect, test } from "vitest";
import { getItemFor } from "@/lib/data/items";
import { isUuid } from "@/lib/data/scope";
import { getTaskFor } from "@/lib/data/tasks";
import { getVendorFor } from "@/lib/data/vendors";
import { createTestHome, hasTestDb } from "./fixtures";

test("isUuid", () => {
  expect(isUuid("a76c2469-109c-40bb-9c33-6c97c3eb02a5")).toBe(true);
  expect(isUuid("x")).toBe(false);
  expect(isUuid("a76c2469-109c-40bb-9c33-6c97c3eb02a5' or 1=1")).toBe(false);
});

describe.skipIf(!hasTestDb)("getters with malformed ids", () => {
  test("return null instead of throwing", async () => {
    const { scope } = await createTestHome();
    await expect(getItemFor(scope, "x")).resolves.toBeNull();
    await expect(getVendorFor(scope, "not-a-uuid")).resolves.toBeNull();
    await expect(getTaskFor(scope, "123")).resolves.toBeNull();
  });
});
