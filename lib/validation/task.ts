import { z } from "zod";
import { RECURRENCE_UNITS, type Recurrence } from "@/lib/domain/constants";
import {
  dateField,
  moneyField,
  optionalHttpsUrl,
  optionalId,
  optionalInt,
  optionalText,
  requiredId,
  requiredText,
} from "./fields";

/**
 * Add/Edit Task form. Recurrence comes in as two fields, `recurrenceEvery` (number) and
 * `recurrenceUnit` (day|week|month|year, or "none"/blank for one-off), and comes out as `recurrence`.
 */
export const taskSchema = z
  .object({
    title: requiredText("Title"),
    location: optionalText("Location", 80),
    dueDate: dateField("Due date"),
    recurrenceEvery: optionalInt("Repeat interval", 1, 365),
    recurrenceUnit: z
      .preprocess(
        (v) => (v === undefined || v === null || v === "" ? "none" : v),
        z.enum([...RECURRENCE_UNITS, "none"], { error: "Choose how often it repeats" }),
      ),
    itemId: optionalId,
    vendorId: optionalId,
    notes: optionalText("Notes", 2000),
  })
  .transform(({ recurrenceEvery, recurrenceUnit, ...rest }) => ({
    ...rest,
    recurrence:
      recurrenceUnit === "none" ? null : ({ every: recurrenceEvery ?? 1, unit: recurrenceUnit } as Recurrence),
  }));
export type TaskInput = z.output<typeof taskSchema>;

const completionFields = {
  date: dateField("Date"),
  cost: moneyField,
  vendorId: optionalId,
  receiptUrl: optionalHttpsUrl,
  notes: optionalText("Notes", 2000),
};

/** Complete modal. `cost` (dollars) comes out as `costCents`. */
export const completeTaskSchema = z
  .object({ taskId: requiredId, ...completionFields })
  .transform(({ cost, ...rest }) => ({ ...rest, costCents: cost }));
export type CompleteTaskInput = z.output<typeof completeTaskSchema>;

/** Log a Repair modal: a log entry with no task, optionally linked to an item. */
export const logRepairSchema = z
  .object({ title: requiredText("Title"), itemId: optionalId, ...completionFields })
  .transform(({ cost, ...rest }) => ({ ...rest, costCents: cost }));
export type LogRepairInput = z.output<typeof logRepairSchema>;
