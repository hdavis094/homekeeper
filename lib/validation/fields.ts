// Reusable zod field schemas for HTML form values: every input arrives as a string,
// blank strings mean "not set" (null), and missing checkboxes mean false.
import { z } from "zod";
import { isValidDateString, isValidTimeZone } from "@/lib/domain/dates";
import { dollarsToCents } from "@/lib/domain/format";

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");
const blankToNull = (v: unknown) => (isBlank(v) ? null : v);

export function requiredText(label: string, max = 120) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

export function optionalText(label: string, max = 500) {
  return z
    .preprocess(blankToNull, z.string().trim().max(max, `${label} must be at most ${max} characters`).nullish())
    .transform((v) => v ?? null);
}

export function dateField(label = "Date") {
  return z
    .string({ error: `${label} is required` })
    .refine((v) => v !== "", `${label} is required`)
    .refine((v) => v === "" || isValidDateString(v), "Enter a valid date");
}

export const optionalId = z
  .preprocess(blankToNull, z.uuid("Invalid selection").nullish())
  .transform((v) => v ?? null);

export const requiredId = z.uuid("Invalid id");

/** Whole number from a form string ("2,400" is fine). Blank → null. */
export function optionalInt(label: string, min: number, max: number) {
  return z
    .preprocess(
      (v) => {
        if (isBlank(v)) return null;
        if (typeof v !== "string") return v;
        const s = v.trim().replaceAll(",", "");
        return /^-?\d+$/.test(s) ? Number(s) : v;
      },
      z
        .number({ error: `${label} must be a whole number` })
        .int(`${label} must be a whole number`)
        .min(min, `${label} must be at least ${min}`)
        .max(max, `${label} must be at most ${max}`)
        .nullish(),
    )
    .transform((v) => v ?? null);
}

/** Dollar amount ("$1,250.50") → integer cents. Numbers are treated as dollars. Blank → null. */
export const moneyField = z
  .preprocess(
    (v) => {
      if (isBlank(v)) return null;
      if (typeof v === "number") return Math.round(v * 100);
      if (typeof v === "string") return dollarsToCents(v) ?? v;
      return v;
    },
    z
      .number({ error: "Enter an amount like 125.50" })
      .int()
      .nonnegative("Enter an amount like 125.50")
      .nullish(),
  )
  .transform((v) => v ?? null);

export const checkbox = z.preprocess(
  (v) => v === true || v === "on" || v === "true" || v === "1",
  z.boolean(),
);

export const emailField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email({ error: "Enter a valid email" }),
);

export const optionalEmail = z
  .preprocess(
    (v) => (isBlank(v) ? null : typeof v === "string" ? v.trim().toLowerCase() : v),
    z.email({ error: "Enter a valid email" }).nullish(),
  )
  .transform((v) => v ?? null);

export const optionalPhone = z
  .preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .regex(/^[0-9+().\-\s]{7,25}$/, "Enter a valid phone number")
      .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a valid phone number")
      .nullish(),
  )
  .transform((v) => v ?? null);

/** https URL (Blob receipts and avatars). Blank → null. */
export const optionalHttpsUrl = z
  .preprocess(blankToNull, z.url({ protocol: /^https$/, error: "Invalid file URL" }).nullish())
  .transform((v) => v ?? null);

export const timeZoneField = z
  .string({ error: "Time zone is required" })
  .refine(isValidTimeZone, "Choose a valid time zone");

export function passwordField(label = "Password") {
  return z
    .string({ error: `${label} is required` })
    .min(8, `${label} must be at least 8 characters`)
    .max(128, `${label} must be at most 128 characters`);
}
