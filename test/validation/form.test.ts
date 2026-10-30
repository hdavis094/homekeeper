import { describe, expect, it } from "vitest";
import { parseForm } from "@/lib/validation/form";
import { itemSchema } from "@/lib/validation/item";

describe("parseForm", () => {
  it("parses FormData into typed data", () => {
    const form = new FormData();
    form.set("name", "Washer");
    form.set("category", "laundry");
    form.set("installedYear", "2022");
    expect(parseForm(itemSchema, form)).toEqual({
      success: true,
      data: { name: "Washer", model: null, category: "laundry", installedYear: 2022, condition: "good", notes: null },
    });
  });

  it("returns the first error message per field", () => {
    const form = new FormData();
    form.set("name", "");
    form.set("category", "garage");
    const result = parseForm(itemSchema, form);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["category", "name"]);
    expect(result.fieldErrors.name).toBe("Name is required");
  });

  it("accepts a plain object", () => {
    expect(parseForm(itemSchema, { name: "Roof", category: "roof" }).success).toBe(true);
  });

  it("puts cross-field errors without a path under formError", async () => {
    const { z } = await import("zod");
    const schema = z.object({ a: z.string() }).refine(() => false, "Nope");
    const result = parseForm(schema, { a: "x" });
    expect(result).toEqual({ success: false, fieldErrors: {}, formError: "Nope" });
  });
});
