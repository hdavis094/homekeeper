import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  HOME_TYPES,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  type Recurrence,
  VENDOR_TRADES,
} from "@/lib/domain/constants";
import { DEFAULT_TIME_ZONE } from "@/lib/domain/dates";

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

// ─── Better Auth ────────────────────────────────────────────────────────────
// Property names must match Better Auth's field names; the adapter looks tables up by export name.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  /** Avatar (Vercel Blob URL). */
  image: text("image"),
  phone: text("phone"),
  timeZone: text("time_zone").default(DEFAULT_TIME_ZONE).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ─── HomeKeeper ─────────────────────────────────────────────────────────────

export const homeTypeEnum = pgEnum("home_type", HOME_TYPES);
export const itemCategoryEnum = pgEnum("item_category", ITEM_CATEGORIES);
export const itemConditionEnum = pgEnum("item_condition", ITEM_CONDITIONS);
export const vendorTradeEnum = pgEnum("vendor_trade", VENDOR_TRADES);

/** One per user in v1, created by the Better Auth `user.create.after` hook. */
export const home = pgTable("home", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  address: text("address"),
  homeType: homeTypeEnum("home_type"),
  yearBuilt: integer("year_built"),
  squareFeet: integer("square_feet"),
  emailReminders: boolean("email_reminders").default(true).notNull(),
  weeklySummary: boolean("weekly_summary").default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const item = pgTable(
  "item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => home.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    model: text("model"),
    category: itemCategoryEnum("category").notNull(),
    installedYear: integer("installed_year"),
    condition: itemConditionEnum("condition").default("good").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("item_home_id_idx").on(t.homeId)],
);

export const vendor = pgTable(
  "vendor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => home.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trade: vendorTradeEnum("trade").notNull(),
    phone: text("phone"),
    email: text("email"),
    /** User-entered, 0–5 with one decimal. */
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("vendor_home_id_idx").on(t.homeId),
    check("vendor_rating_range", sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
  ],
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => home.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    location: text("location"),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    /** `{ every, unit }`, or null for a one-off task. */
    recurrence: jsonb("recurrence").$type<Recurrence>(),
    itemId: uuid("item_id").references(() => item.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "set null" }),
    notes: text("notes"),
    /** Calendar date a one-off task was completed. Recurring tasks move `dueDate` forward instead. */
    completedAt: date("completed_at", { mode: "string" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("task_home_id_due_date_idx").on(t.homeId, t.dueDate)],
);

/** Completed work (and expenses): one row per task completion or "Log a Repair". */
export const logEntry = pgTable(
  "log_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => home.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "set null" }),
    /** The item worked on (copied from the task on completion, or picked in Log a Repair). */
    itemId: uuid("item_id").references(() => item.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    costCents: integer("cost_cents"),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "set null" }),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    index("log_entry_home_id_date_idx").on(t.homeId, t.date),
    index("log_entry_vendor_id_idx").on(t.vendorId),
    index("log_entry_task_id_idx").on(t.taskId),
    check("log_entry_cost_nonnegative", sql`${t.costCents} IS NULL OR ${t.costCents} >= 0`),
  ],
);

/** Lane H: at most one reminder per task per day (in the user's time zone). */
export const reminderSent = pgTable(
  "reminder_sent",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    sentOn: date("sent_on", { mode: "string" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.sentOn] })],
);

export type User = typeof user.$inferSelect;
export type Home = typeof home.$inferSelect;
export type Item = typeof item.$inferSelect;
export type Vendor = typeof vendor.$inferSelect;
export type Task = typeof task.$inferSelect;
export type LogEntry = typeof logEntry.$inferSelect;
