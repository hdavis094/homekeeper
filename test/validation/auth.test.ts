import { describe, expect, it } from "vitest";
import {
  requestResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

describe("signUpSchema", () => {
  const valid = {
    name: "Alex Morgan",
    email: " Alex.Morgan@Email.com ",
    password: "homekeeper-demo",
    confirmPassword: "homekeeper-demo",
  };

  it("normalizes the email and drops the confirmation", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@email.com",
      password: "homekeeper-demo",
    });
  });

  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0]?.message).toBe("Passwords don't match");
  });

  it.each([
    ["name", { ...valid, name: " " }],
    ["email", { ...valid, email: "alex@" }],
    ["password", { ...valid, password: "short", confirmPassword: "short" }],
    ["password", { ...valid, password: "x".repeat(129), confirmPassword: "x".repeat(129) }],
  ])("rejects a bad %s", (field, input) => {
    expect(signUpSchema.safeParse(input).error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("signInSchema", () => {
  it("parses email, password and the remember-me checkbox", () => {
    expect(signInSchema.parse({ email: "A@B.co", password: "x", rememberMe: "on" })).toEqual({
      email: "a@b.co",
      password: "x",
      rememberMe: true,
    });
    expect(signInSchema.parse({ email: "a@b.co", password: "x" }).rememberMe).toBe(false);
  });

  it("requires a password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("requestResetSchema", () => {
  it("requires a valid email", () => {
    expect(requestResetSchema.parse({ email: "a@b.co" })).toEqual({ email: "a@b.co" });
    expect(requestResetSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires a token and matching new passwords", () => {
    expect(
      resetPasswordSchema.parse({ token: "abc", password: "new-password", confirmPassword: "new-password" }),
    ).toEqual({ token: "abc", password: "new-password" });
    const result = resetPasswordSchema.safeParse({ token: "", password: "new-password", confirmPassword: "x" });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["confirmPassword", "token"]);
  });
});
