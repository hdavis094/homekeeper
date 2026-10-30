import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestHome, hasTestDb } from "../data/fixtures";
import { listVendorsFor } from "@/lib/data/vendors";

const homeRef: { scope: { homeId: string; today: string } | null } = { scope: null };

vi.mock("@/lib/session", () => ({
  getCurrentHome: async () => ({
    home: { id: homeRef.scope!.homeId },
    user: { id: "test" },
    today: homeRef.scope!.today,
    timeZone: "America/New_York",
  }),
}));

import { createVendor, updateVendor, deleteVendor } from "@/lib/actions/vendors";

describe.skipIf(!hasTestDb)("vendor actions", { timeout: 60_000 }, () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const t = await createTestHome();
    homeRef.scope = t.scope as any;
    cleanup = async () => { await t.cleanup(); };
  });

  afterAll(async () => {
    await cleanup?.();
  });

  it("creates a vendor", async () => {
    const fd = new FormData();
    fd.set("name", "Acme Plumbing");
    fd.set("trade", "plumbing");
    fd.set("phone", "555-1234");
    fd.set("email", "acme@example.com");
    fd.set("rating", "4.5");
    fd.set("notes", "Fast");

    const res = await createVendor(undefined, fd);
    expect(res.success).toBe(true);

    const { vendors } = await listVendorsFor(homeRef.scope!);
    const v = vendors.find((x) => x.name === "Acme Plumbing");
    expect(v).toBeTruthy();
    expect(v?.trade).toBe("plumbing");
    expect(v?.rating).toBe(4.5);
  });

  it("rejects invalid input", async () => {
    const fd = new FormData();
    fd.set("name", "");
    fd.set("trade", "plumbing");
    const res = await createVendor(fd);
    expect(res.success).toBe(false);
  });

  it("updates a vendor", async () => {
    const { vendors } = await listVendorsFor(homeRef.scope!);
    const v = vendors.find((x) => x.name === "Acme Plumbing")!;
    const fd = new FormData();
    fd.set("id", v.id);
    fd.set("name", "Acme Plumbing LLC");
    fd.set("trade", "plumbing");
    fd.set("phone", "");
    fd.set("email", "");
    fd.set("rating", "");
    fd.set("notes", "");
    const res = await updateVendor(v.id, fd);
    expect(res.success).toBe(true);

    const { vendors: after } = await listVendorsFor(homeRef.scope!);
    const updated = after.find((x) => x.id === v.id);
    expect(updated?.name).toBe("Acme Plumbing LLC");
    expect(updated?.phone).toBeNull();
  });

  it("deletes a vendor", async () => {
    const { vendors } = await listVendorsFor(homeRef.scope!);
    const v = vendors.find((x) => x.name === "Acme Plumbing LLC")!;
    await deleteVendor(v.id);
    const { vendors: after } = await listVendorsFor(homeRef.scope!);
    expect(after.find((x) => x.id === v.id)).toBeUndefined();
  });
});
