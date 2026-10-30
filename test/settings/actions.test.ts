import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { home, item, vendor, task, logEntry, reminderSent, session, account, user } from "@/lib/db/schema";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { getHomeProfile } from "@/lib/data/home";
import { createTestHome, signInHeaders } from "@/test/data/fixtures";
import { updateProfile, updateHome, updateNotifications, changePassword, updateAvatar, removeAvatar, deleteAccount } from "@/lib/actions/settings";

const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));
vi.mock("@vercel/blob", () => ({ del: vi.fn(async () => {}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("settings actions against in-memory Postgres", { timeout: 60_000 }, () => {
  let owner: Awaited<ReturnType<typeof createTestHome>>;
  let other: Awaited<ReturnType<typeof createTestHome>>;
  beforeAll(async () => {
    owner = await createTestHome();
    other = await createTestHome();
    request.headers = await signInHeaders(owner.user.email, "test-password-123");
  });
  afterAll(async () => {
    await owner?.cleanup();
    await other?.cleanup();
  });

  it("saves validated profile fields for the signed-in user and keeps email read-only", async () => {
    const result = await updateProfile({}, form({ name: " Alex Updated ", phone: "(555) 234-5678", timeZone: "America/Los_Angeles", email: other.user.email, userId: other.user.id }));
    expect(result.success).toBe(true);
    expect((await getHomeProfile()).user).toMatchObject({ name: "Alex Updated", phone: "(555) 234-5678", timeZone: "America/Los_Angeles", email: owner.user.email });
    const untouched = await auth.api.getSession({ headers: await signInHeaders(other.user.email, "test-password-123") });
    expect(untouched?.user.name).toBe("Test User");
  });
  it("rejects invalid profile fields without changing saved data", async () => {
    const result = await updateProfile({}, form({ name: "", phone: "bad", timeZone: "Unknown/Zone" }));
    expect(result.success).toBe(false);
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["name", "phone", "timeZone"]);
    expect((await getHomeProfile()).user.name).toBe("Alex Updated");
  });

  it("saves home details only to the current home, including clearing optional fields", async () => {
    expect((await updateHome({}, form({ address: "45 Oak Street", homeType: "condo", yearBuilt: "2001", squareFeet: "1,250 sq ft", homeId: other.home.id }))).success).toBe(true);
    expect((await getHomeProfile()).home).toMatchObject({ address: "45 Oak Street", homeType: "condo", yearBuilt: 2001, squareFeet: 1250 });
    expect((await updateHome({}, form({ address: "", homeType: "", yearBuilt: "", squareFeet: "" }))).success).toBe(true);
    expect((await getHomeProfile()).home).toMatchObject({ address: null, homeType: null, yearBuilt: null, squareFeet: null });
  });

  it("saves each notification preference immediately, including turning it off", async () => {
    expect((await updateNotifications({}, form({ emailReminders: "false", weeklySummary: "true", homeId: other.home.id }))).success).toBe(true);
    expect((await getHomeProfile()).home).toMatchObject({ emailReminders: false, weeklySummary: true });
    expect((await updateNotifications({}, form({ emailReminders: "true", weeklySummary: "false" }))).success).toBe(true);
    expect((await getHomeProfile()).home).toMatchObject({ emailReminders: true, weeklySummary: false });
    const otherHeaders = await signInHeaders(other.user.email, "test-password-123");
    const previousHeaders = request.headers;
    request.headers = otherHeaders;
    expect((await getHomeProfile()).home).toMatchObject({ address: null, emailReminders: true, weeklySummary: false });
    request.headers = previousHeaders;
  });

  it("checks the current password and changes the credential through Better Auth", async () => {
    const wrong = await changePassword({}, form({ currentPassword: "incorrect", newPassword: "new-password-456" }));
    expect(wrong).toMatchObject({ success: false });
    expect((await changePassword({}, form({ currentPassword: "test-password-123", newPassword: "new-password-456" }))).success).toBe(true);
    expect(await auth.api.getSession({ headers: request.headers })).not.toBeNull();
    await expect(signInHeaders(owner.user.email, "test-password-123")).rejects.toThrow("Sign-in failed");
    request.headers = await signInHeaders(owner.user.email, "new-password-456");
    expect((await getHomeProfile()).user.name).toBe("Alex Updated");
  });

  it("accepts only avatar Blob URLs, replaces the photo, and removes it", async () => {
    expect((await updateAvatar({}, form({ url: "https://example.com/image.png" }))).success).toBe(false);
    expect((await updateAvatar({}, form({ url: "https://settings-test.public.blob.vercel-storage.com/receipts/private.png" }))).success).toBe(false);
    expect((await updateAvatar({}, form({ url: `https://settings-test.public.blob.vercel-storage.com/avatars/${other.user.id}-photo.png` }))).success).toBe(false);
    const url = `https://settings-test.public.blob.vercel-storage.com/avatars/${owner.user.id}-photo.png`;
    expect((await updateAvatar({}, form({ url }))).success).toBe(true);
    expect((await getHomeProfile()).user.image).toBe(url);
    expect((await removeAvatar()).success).toBe(true);
    expect((await getHomeProfile()).user.image).toBeNull();
  });

  it("keeps account data when Better Auth requires a recent sign-in", async () => {
    const previousHeaders = request.headers;
    request.headers = await signInHeaders(other.user.email, "test-password-123");
    const current = await auth.api.getSession({ headers: request.headers });
    await db.update(session).set({ createdAt: new Date("2020-01-01T00:00:00Z") }).where(eq(session.id, current!.session.id));
    const result = await deleteAccount({}, form({ confirmation: "DELETE" }));
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("sign out and sign in again") });
    expect((await getHomeProfile()).user.id).toBe(other.user.id);
    request.headers = previousHeaders;
  });

  it("requires DELETE, deletes all home data, revokes the session and leaves other homes intact", async () => {
    const receiptUrl = "https://settings-test.public.blob.vercel-storage.com/receipts/repair.pdf";
    const [i] = await db.insert(item).values({ homeId: owner.home.id, name: "Boiler", category: "hvac" }).returning();
    const [v] = await db.insert(vendor).values({ homeId: owner.home.id, name: "Pat", trade: "general" }).returning();
    const [t] = await db.insert(task).values({ homeId: owner.home.id, title: "Service boiler", dueDate: "2026-10-29", itemId: i.id, vendorId: v.id }).returning();
    await db.insert(logEntry).values({ homeId: owner.home.id, taskId: t.id, title: "Repair", date: "2026-10-29", receiptUrl });
    await db.insert(reminderSent).values({ taskId: t.id, sentOn: "2026-10-29" });
    expect((await deleteAccount({}, form({ confirmation: "delete" }))).success).toBe(false);
    expect((await getHomeProfile()).user.id).toBe(owner.user.id);
    vi.mocked(del).mockRejectedValueOnce(new Error("Blob storage unavailable"));
    await expect(deleteAccount({}, form({ confirmation: "DELETE" }))).rejects.toThrow("REDIRECT:/");
    expect(await auth.api.getSession({ headers: request.headers })).toBeNull();
    expect(await db.select().from(home).where(eq(home.id, owner.home.id))).toEqual([]);
    for (const table of [item, vendor, task, logEntry]) {
      const column = table.homeId;
      expect(await db.select().from(table).where(eq(column, owner.home.id))).toEqual([]);
    }
    expect(await db.select().from(reminderSent).where(eq(reminderSent.taskId, t.id))).toEqual([]);
    expect(await db.select().from(account).where(eq(account.userId, owner.user.id))).toEqual([]);
    expect(await db.select().from(session).where(eq(session.userId, owner.user.id))).toEqual([]);
    expect(await db.select().from(user).where(eq(user.id, other.user.id))).toHaveLength(1);
    expect(del).toHaveBeenCalledWith(receiptUrl);
  });

  it("requires authentication for every action", async () => {
    request.headers = new Headers();
    for (const action of [updateProfile, updateHome, updateNotifications, changePassword, updateAvatar, deleteAccount]) {
      await expect(action({}, new FormData())).rejects.toThrow("REDIRECT:/?expired=1");
    }
    await expect(removeAvatar()).rejects.toThrow("REDIRECT:/?expired=1");
  });

});
