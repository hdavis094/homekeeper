import { z } from "zod";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@/lib/domain/constants";
import { optionalInt, optionalText, requiredText } from "./fields";

export const itemSchema = z.object({
  name: requiredText("Name", 80),
  model: optionalText("Model", 120),
  category: z.enum(ITEM_CATEGORIES, { error: "Choose a category" }),
  installedYear: optionalInt("Installed year", 1800, 2100),
  condition: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? "good" : v),
    z.enum(ITEM_CONDITIONS, { error: "Choose a condition" }),
  ),
  notes: optionalText("Notes", 2000),
});
export type ItemInput = z.output<typeof itemSchema>;
