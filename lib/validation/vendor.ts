import { z } from "zod";
import { VENDOR_TRADES } from "@/lib/domain/constants";
import { optionalEmail, optionalPhone, optionalText, requiredText } from "./fields";

const RATING_ERROR = "Rating must be 0–5 with at most one decimal";

export const vendorSchema = z.object({
  name: requiredText("Name", 80),
  trade: z.enum(VENDOR_TRADES, { error: "Choose a trade" }),
  phone: optionalPhone,
  email: optionalEmail,
  rating: z
    .preprocess(
      (v) => {
        if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return null;
        if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v.trim())) return Number(v.trim());
        return v;
      },
      z
        .number({ error: RATING_ERROR })
        .min(0, RATING_ERROR)
        .max(5, RATING_ERROR)
        .refine((n) => Math.round(n * 10) === n * 10, RATING_ERROR)
        .nullish(),
    )
    .transform((v) => v ?? null),
  notes: optionalText("Notes", 2000),
});
export type VendorInput = z.output<typeof vendorSchema>;
