import type { SelectOption } from "@/app/ui/select";
import type { Recurrence, RecurrenceUnit } from "@/lib/domain/constants";

/** `{ id, name }` rows from `listItemOptions()` / `listVendorOptions()`. */
export type NamedOption = { id: string; name: string };

export function selectOptions(rows: readonly NamedOption[], none: string): SelectOption[] {
  return [{ value: "", label: none }, ...rows.map((r) => ({ value: r.id, label: r.name }))];
}

/** The fields the Add/Edit form needs (plain data, safe to pass to the client). */
export type TaskFormValues = {
  id: string;
  title: string;
  location: string | null;
  dueDate: string;
  recurrence: Recurrence | null;
  itemId: string | null;
  vendorId: string | null;
  notes: string | null;
  completed: boolean;
};

export const REPEAT_OPTIONS: { value: RecurrenceUnit | "none"; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];
