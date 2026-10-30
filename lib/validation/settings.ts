import { z } from "zod";
import { HOME_TYPES } from "@/lib/domain/constants";
import {
  checkbox,
  optionalInt,
  optionalPhone,
  optionalText,
  passwordField,
  requiredText,
  timeZoneField,
} from "./fields";

/** Profile section. Email is read-only in v1. */
export const profileSchema = z.object({
  name: requiredText("Full name", 80),
  phone: optionalPhone,
  timeZone: timeZoneField,
});
export type ProfileInput = z.output<typeof profileSchema>;

export const homeDetailsSchema = z.object({
  address: optionalText("Address", 200),
  homeType: z
    .preprocess(
      (v) => (v === undefined || v === "" ? null : v),
      z.enum(HOME_TYPES, { error: "Choose a home type" }).nullable(),
    ),
  yearBuilt: optionalInt("Year built", 1800, 2100),
  squareFeet: z
    .preprocess(
      (v) => (typeof v === "string" ? v.replace(/\s*sq\.?\s*ft\.?\s*$/i, "") : v),
      optionalInt("Square footage", 1, 1_000_000),
    ),
});
export type HomeDetailsInput = z.output<typeof homeDetailsSchema>;

/** Toggles; a missing value means off. */
export const notificationsSchema = z.object({
  emailReminders: checkbox,
  weeklySummary: checkbox,
});
export type NotificationsInput = z.output<typeof notificationsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: "Current password is required" }).min(1, "Current password is required"),
    newPassword: passwordField("New password"),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one",
  });
export type ChangePasswordInput = z.output<typeof changePasswordSchema>;
