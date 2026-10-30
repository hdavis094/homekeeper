import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  homeDetailsSchema,
  notificationsSchema,
  profileSchema,
} from "@/lib/validation/settings";

describe("profileSchema", () => {
  it("parses name, phone and an IANA time zone", () => {
    expect(
      profileSchema.parse({ name: " Alex Morgan ", phone: "(555) 123-4567", timeZone: "America/Chicago" }),
    ).toEqual({ name: "Alex Morgan", phone: "(555) 123-4567", timeZone: "America/Chicago" });
  });

  it("rejects unknown time zones and empty names", () => {
    const result = profileSchema.safeParse({ name: "", timeZone: "Mars/Olympus" });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["name", "timeZone"]);
  });
});

describe("homeDetailsSchema", () => {
  it("parses formatted square footage and a home type", () => {
    expect(
      homeDetailsSchema.parse({
        address: "123 Maple St, Springfield",
        homeType: "single_family",
        yearBuilt: "1998",
        squareFeet: "2,400 sq ft",
      }),
    ).toEqual({
      address: "123 Maple St, Springfield",
      homeType: "single_family",
      yearBuilt: 1998,
      squareFeet: 2400,
    });
  });

  it("allows every field to be blank", () => {
    expect(homeDetailsSchema.parse({ address: "", homeType: "", yearBuilt: "", squareFeet: "" })).toEqual({
      address: null,
      homeType: null,
      yearBuilt: null,
      squareFeet: null,
    });
  });

  it.each([
    ["homeType", { homeType: "castle" }],
    ["yearBuilt", { yearBuilt: "1700" }],
    ["squareFeet", { squareFeet: "0" }],
    ["squareFeet", { squareFeet: "big" }],
  ])("rejects a bad %s", (field, input) => {
    expect(homeDetailsSchema.safeParse(input).error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("notificationsSchema", () => {
  it("reads checkbox form values and booleans", () => {
    expect(notificationsSchema.parse({ emailReminders: "on" })).toEqual({
      emailReminders: true,
      weeklySummary: false,
    });
    expect(notificationsSchema.parse({ emailReminders: false, weeklySummary: true })).toEqual({
      emailReminders: false,
      weeklySummary: true,
    });
    expect(notificationsSchema.parse({ emailReminders: "false", weeklySummary: "true" })).toEqual({
      emailReminders: false,
      weeklySummary: true,
    });
  });
});

describe("changePasswordSchema", () => {
  it("requires the current password and a new one of 8–128 characters", () => {
    expect(changePasswordSchema.parse({ currentPassword: "old-pass", newPassword: "new-password" })).toEqual({
      currentPassword: "old-pass",
      newPassword: "new-password",
    });
    const result = changePasswordSchema.safeParse({ currentPassword: "", newPassword: "short" });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["currentPassword", "newPassword"]);
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({ currentPassword: "same-pass", newPassword: "same-pass" });
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });
});
