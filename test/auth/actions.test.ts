import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { home, task, user, verification } from "@/lib/db/schema";
import { requestReset, resetPassword, signIn, signUp } from "@/lib/actions/auth";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};
const email = `auth-${randomUUID()}@homekeeper.test`;
const password = "homekeeper-test-123";

// The suite uses the configured per-worker in-memory database, including the real auth hooks.
describe("auth server actions", () => {
  afterAll(async () => {
    await db.delete(user).where(eq(user.email, email));
    vi.restoreAllMocks();
  });

  it("rejects invalid sign-in before calling auth", async () => {
    const spy = vi.spyOn(auth.api, "signInEmail");
    expect(await signIn({}, form({ email: "invalid", password: "" }))).toMatchObject({
      fieldErrors: { email: "Enter a valid email", password: "Password is required" },
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reports every sign-up validation error without creating an account", async () => {
    const spy = vi.spyOn(auth.api, "signUpEmail");
    expect(await signUp({}, form({ name: "", email, password: "short", confirmPassword: "different" })))
      .toMatchObject({ fieldErrors: {
        name: "Name is required", password: "Password must be at least 8 characters",
        confirmPassword: "Passwords don't match",
      } });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("validates reset email and token/password confirmation before auth", async () => {
    expect(await requestReset({}, form({ email: "" }))).toMatchObject({ fieldErrors: { email: "Enter a valid email" } });
    expect(await resetPassword({}, form({ token: "", password: "short", confirmPassword: "different" })))
      .toMatchObject({ fieldErrors: { token: "Reset link is invalid", password: "New password must be at least 8 characters", confirmPassword: "Passwords don't match" } });
  });

  it("signs up and creates an empty home, then redirects to /home", async () => {
    await expect(signUp({}, form({ name: "Lane A", email, password, confirmPassword: password })))
      .rejects.toThrow("REDIRECT:/home");
    const [created] = await db.select().from(user).where(eq(user.email, email));
    const homes = await db.select().from(home).where(eq(home.userId, created.id));
    expect(homes).toHaveLength(1);
    expect(await db.select().from(task).where(eq(task.homeId, homes[0].id))).toEqual([]);
  });

  it("shows inline auth errors and accepts valid login with remember me", async () => {
    expect(await signIn({}, form({ email, password: "wrong-password" }))).toMatchObject({
      formError: "Email or password is incorrect.",
    });
    await expect(signIn({}, form({ email, password, rememberMe: "on" }))).rejects.toThrow("REDIRECT:/home");
  });

  it("gives the same inbox notice for existing and unknown emails", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const existing = await requestReset({}, form({ email }));
    const unknown = await requestReset({}, form({ email: `unknown-${randomUUID()}@homekeeper.test` }));
    expect(existing).toEqual(unknown);
    expect(existing.message).toContain("Check your inbox");
    log.mockRestore();
  });

  it("resets the password once, revokes sessions, and returns to login", async () => {
    const [created] = await db.select().from(user).where(eq(user.email, email));
    const [reset] = await db.select().from(verification).where(eq(verification.value, created.id));
    const token = reset.identifier.replace("reset-password:", "");
    const nextPassword = "new-homekeeper-test-123";
    const session = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
    const headers = new Headers({ cookie: session.headers.getSetCookie().map((v) => v.split(";")[0]).join("; ") });
    await expect(resetPassword({}, form({ token, password: nextPassword, confirmPassword: nextPassword })))
      .rejects.toThrow("REDIRECT:/?reset=success");
    expect(await auth.api.getSession({ headers })).toBeNull();
    expect(await signIn({}, form({ email, password }))).toHaveProperty("formError");
    await expect(signIn({}, form({ email, password: nextPassword }))).rejects.toThrow("REDIRECT:/home");
    expect(await resetPassword({}, form({ token, password: nextPassword, confirmPassword: nextPassword })))
      .toMatchObject({ formError: "This reset link is invalid or has expired. Request a new link." });
  });
});
