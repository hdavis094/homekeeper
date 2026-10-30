import { describe, expect, it } from "vitest";
import { itemSchema } from "@/lib/validation/item";
import { vendorSchema } from "@/lib/validation/vendor";

describe("itemSchema", () => {
  it("parses a full item", () => {
    expect(
      itemSchema.parse({
        name: "Water Heater",
        model: "Rheem Performance Platinum",
        category: "plumbing",
        installedYear: "2021",
        condition: "needs_service",
        notes: "",
      }),
    ).toEqual({
      name: "Water Heater",
      model: "Rheem Performance Platinum",
      category: "plumbing",
      installedYear: 2021,
      condition: "needs_service",
      notes: null,
    });
  });

  it("defaults condition to good and allows no install year", () => {
    const parsed = itemSchema.parse({ name: "Dryer", category: "laundry", installedYear: "" });
    expect(parsed.condition).toBe("good");
    expect(parsed.installedYear).toBeNull();
  });

  it.each([
    ["name", { name: "", category: "hvac" }],
    ["category", { name: "Thing", category: "garage" }],
    ["condition", { name: "Thing", category: "hvac", condition: "broken" }],
    ["installedYear", { name: "Thing", category: "hvac", installedYear: "1799" }],
    ["installedYear", { name: "Thing", category: "hvac", installedYear: "2101" }],
    ["installedYear", { name: "Thing", category: "hvac", installedYear: "20x1" }],
  ])("rejects a bad %s", (field, input) => {
    expect(itemSchema.safeParse(input).error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("vendorSchema", () => {
  const valid = { name: "Mike's Plumbing Co.", trade: "plumbing" };

  it("parses a full vendor", () => {
    expect(
      vendorSchema.parse({
        ...valid,
        phone: " (555) 212-3344 ",
        email: "Mike@Example.com",
        rating: "4.9",
        notes: "Fast",
      }),
    ).toEqual({
      name: "Mike's Plumbing Co.",
      trade: "plumbing",
      phone: "(555) 212-3344",
      email: "mike@example.com",
      rating: 4.9,
      notes: "Fast",
    });
  });

  it("allows empty phone, email and rating", () => {
    expect(vendorSchema.parse({ ...valid, phone: "", email: "", rating: "" })).toMatchObject({
      phone: null,
      email: null,
      rating: null,
    });
  });

  it.each([
    ["trade", { ...valid, trade: "roofing" }],
    ["email", { ...valid, email: "not-an-email" }],
    ["rating", { ...valid, rating: "5.1" }],
    ["rating", { ...valid, rating: "-1" }],
    ["rating", { ...valid, rating: "4.55" }],
    ["phone", { ...valid, phone: "call me" }],
  ])("rejects a bad %s", (field, input) => {
    expect(vendorSchema.safeParse(input).error?.issues.map((i) => i.path[0])).toContain(field);
  });
});
