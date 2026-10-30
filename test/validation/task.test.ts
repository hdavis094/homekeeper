import { describe, expect, it } from "vitest";
import { completeTaskSchema, logRepairSchema, taskSchema } from "@/lib/validation/task";

const ITEM_ID = "0b6f7c1e-4d0a-4c3e-9b8f-2a1d3e4f5a6b";
const VENDOR_ID = "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

describe("taskSchema", () => {
  const valid = { title: "  Flush Water Heater ", location: "Basement", dueDate: "2026-03-04" };

  it("trims and normalizes optional fields to null", () => {
    expect(taskSchema.parse({ ...valid, itemId: "", vendorId: "", notes: "  " })).toEqual({
      title: "Flush Water Heater",
      location: "Basement",
      dueDate: "2026-03-04",
      recurrence: null,
      itemId: null,
      vendorId: null,
      notes: null,
    });
  });

  it("builds a recurrence from every + unit", () => {
    const parsed = taskSchema.parse({ ...valid, recurrenceEvery: "3", recurrenceUnit: "month" });
    expect(parsed.recurrence).toEqual({ every: 3, unit: "month" });
  });

  it("defaults every to 1 and treats unit 'none' as no recurrence", () => {
    expect(taskSchema.parse({ ...valid, recurrenceUnit: "year" }).recurrence).toEqual({ every: 1, unit: "year" });
    expect(taskSchema.parse({ ...valid, recurrenceEvery: "3", recurrenceUnit: "none" }).recurrence).toBeNull();
  });

  it("keeps linked item and vendor ids", () => {
    const parsed = taskSchema.parse({ ...valid, itemId: ITEM_ID, vendorId: VENDOR_ID });
    expect(parsed.itemId).toBe(ITEM_ID);
    expect(parsed.vendorId).toBe(VENDOR_ID);
  });

  it.each([
    ["title", { ...valid, title: "   " }],
    ["title", { ...valid, title: "x".repeat(121) }],
    ["dueDate", { ...valid, dueDate: "2026-02-30" }],
    ["dueDate", { ...valid, dueDate: undefined }],
    ["recurrenceEvery", { ...valid, recurrenceEvery: "0", recurrenceUnit: "week" }],
    ["recurrenceEvery", { ...valid, recurrenceEvery: "1.5", recurrenceUnit: "week" }],
    ["recurrenceUnit", { ...valid, recurrenceUnit: "fortnight" }],
    ["itemId", { ...valid, itemId: "not-a-uuid" }],
  ])("rejects a bad %s", (field, input) => {
    const result = taskSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("completeTaskSchema", () => {
  const valid = { taskId: ITEM_ID, date: "2026-03-06" };

  it("converts the dollar cost to cents", () => {
    expect(completeTaskSchema.parse({ ...valid, cost: "$1,250.5", vendorId: VENDOR_ID })).toEqual({
      taskId: ITEM_ID,
      date: "2026-03-06",
      costCents: 125_050,
      vendorId: VENDOR_ID,
      receiptUrl: null,
      notes: null,
    });
  });

  it("allows no cost", () => {
    expect(completeTaskSchema.parse({ ...valid, cost: "" }).costCents).toBeNull();
  });

  it("accepts an https receipt URL and rejects anything else", () => {
    const url = "https://abc.public.blob.vercel-storage.com/receipts/r-123.pdf";
    expect(completeTaskSchema.parse({ ...valid, receiptUrl: url }).receiptUrl).toBe(url);
    expect(completeTaskSchema.safeParse({ ...valid, receiptUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it.each([
    ["taskId", { ...valid, taskId: "" }],
    ["date", { ...valid, date: "yesterday" }],
    ["cost", { ...valid, cost: "-20" }],
    ["cost", { ...valid, cost: "lots" }],
  ])("rejects a bad %s", (field, input) => {
    const result = completeTaskSchema.safeParse(input);
    expect(result.error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("logRepairSchema", () => {
  it("parses a repair with an optional item", () => {
    expect(
      logRepairSchema.parse({ title: "Fix leaky faucet", date: "2026-03-01", cost: "45", itemId: ITEM_ID }),
    ).toEqual({
      title: "Fix leaky faucet",
      date: "2026-03-01",
      costCents: 4_500,
      vendorId: null,
      itemId: ITEM_ID,
      receiptUrl: null,
      notes: null,
    });
  });

  it("requires a title and date", () => {
    const result = logRepairSchema.safeParse({ title: "", date: "" });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["date", "title"]);
  });
});
