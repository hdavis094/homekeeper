// Enum values shared by the DB schema, zod validation, and UI. Labels are for display.

export const ITEM_CATEGORIES = [
  "hvac",
  "kitchen",
  "laundry",
  "exterior",
  "safety",
  "plumbing",
  "electrical",
  "roof",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  hvac: "HVAC",
  kitchen: "Kitchen",
  laundry: "Laundry",
  exterior: "Exterior",
  safety: "Safety",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roof: "Roof",
};

export const ITEM_CONDITIONS = ["good", "needs_service"] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];
export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  good: "Good",
  needs_service: "Needs Service",
};

export const VENDOR_TRADES = ["plumbing", "electrical", "hvac", "landscaping", "general"] as const;
export type VendorTrade = (typeof VENDOR_TRADES)[number];
export const VENDOR_TRADE_LABELS: Record<VendorTrade, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  landscaping: "Landscaping",
  general: "General",
};

export const HOME_TYPES = ["single_family", "townhouse", "condo", "apartment", "other"] as const;
export type HomeType = (typeof HOME_TYPES)[number];
export const HOME_TYPE_LABELS: Record<HomeType, string> = {
  single_family: "Single Family",
  townhouse: "Townhouse",
  condo: "Condo",
  apartment: "Apartment",
  other: "Other",
};

export const RECURRENCE_UNITS = ["day", "week", "month", "year"] as const;
export type RecurrenceUnit = (typeof RECURRENCE_UNITS)[number];
export type Recurrence = { every: number; unit: RecurrenceUnit };

export const TASK_STATUSES = ["overdue", "due_soon", "scheduled", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  scheduled: "Scheduled",
  completed: "Completed",
};

/** Days ahead (inclusive) that count as "due soon". */
export const DUE_SOON_DAYS = 7;
/** Days ahead (inclusive) that count as "upcoming" on the Home dashboard. */
export const UPCOMING_DAYS = 30;

/** Common IANA zones for the Settings time-zone select. Any valid IANA zone is accepted. */
export const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
] as const;
