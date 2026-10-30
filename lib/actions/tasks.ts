"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { item, logEntry, task, vendor } from "@/lib/db/schema";
import { nextDueDate } from "@/lib/domain/tasks";
import { requiredId } from "@/lib/validation/fields";
import { parseForm } from "@/lib/validation/form";
import { completeTaskSchema, logRepairSchema, taskSchema } from "@/lib/validation/task";
import { getCurrentHome } from "@/lib/session";

/** Result of every task action; forms show `fieldErrors` next to inputs and `formError` above them. */
export type TaskActionState = {
  ok: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
} | null;

type Result = NonNullable<TaskActionState>;

const NOT_FOUND: Result = { ok: false, formError: "Task not found" };

/** Pages that show tasks, log entries (spend, history) or "last hired". */
function revalidateTaskPages() {
  for (const path of ["/tasks", "/home", "/schedule", "/inventory", "/vendors"]) revalidatePath(path);
}

function invalid(fieldErrors: Record<string, string>, formError?: string): Result {
  return formError === undefined ? { ok: false, fieldErrors } : { ok: false, fieldErrors, formError };
}

/** Linked item/vendor ids must belong to the same home. Returns field errors, or null when fine. */
async function checkLinks(
  homeId: string,
  links: { itemId?: string | null; vendorId?: string | null },
): Promise<Record<string, string> | null> {
  const [items, vendors] = await Promise.all([
    links.itemId
      ? db.select({ id: item.id }).from(item).where(and(eq(item.id, links.itemId), eq(item.homeId, homeId)))
      : [],
    links.vendorId
      ? db
          .select({ id: vendor.id })
          .from(vendor)
          .where(and(eq(vendor.id, links.vendorId), eq(vendor.homeId, homeId)))
      : [],
  ]);
  const errors: Record<string, string> = {};
  if (links.itemId && items.length === 0) errors.itemId = "Choose an item from your inventory";
  if (links.vendorId && vendors.length === 0) errors.vendorId = "Choose one of your vendors";
  return Object.keys(errors).length ? errors : null;
}

async function findTask(homeId: string, id: unknown) {
  const parsed = requiredId.safeParse(id);
  if (!parsed.success) return null;
  const [row] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, parsed.data), eq(task.homeId, homeId)))
    .limit(1);
  return row ?? null;
}

/** Add Task modal. */
export async function createTask(_prev: TaskActionState, formData: FormData): Promise<Result> {
  const { home } = await getCurrentHome();
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors, parsed.formError);
  const linkErrors = await checkLinks(home.id, parsed.data);
  if (linkErrors) return invalid(linkErrors);

  await db.insert(task).values({ ...parsed.data, homeId: home.id });
  revalidateTaskPages();
  return { ok: true };
}

/** Edit Task modal; the form carries the task `id`. */
export async function updateTask(_prev: TaskActionState, formData: FormData): Promise<Result> {
  const { home } = await getCurrentHome();
  const existing = await findTask(home.id, formData.get("id"));
  if (!existing) return NOT_FOUND;
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors, parsed.formError);
  const linkErrors = await checkLinks(home.id, parsed.data);
  if (linkErrors) return invalid(linkErrors);

  await db
    .update(task)
    .set(parsed.data)
    .where(and(eq(task.id, existing.id), eq(task.homeId, home.id)));
  revalidateTaskPages();
  return { ok: true };
}

/** Deletes a task. Its log entries stay (history and spend) with `taskId` cleared by the FK. */
export async function deleteTask(id: string): Promise<Result> {
  const { home } = await getCurrentHome();
  const existing = await findTask(home.id, id);
  if (!existing) return NOT_FOUND;
  await db.delete(task).where(and(eq(task.id, existing.id), eq(task.homeId, home.id)));
  revalidateTaskPages();
  return { ok: true };
}

/**
 * Complete modal: logs the work (copying the task's item, and its vendor unless the form sends a
 * `vendorId` field), then moves a recurring task's due date forward or marks a one-off task completed.
 */
export async function completeTask(_prev: TaskActionState, formData: FormData): Promise<Result> {
  const { home } = await getCurrentHome();
  const parsed = parseForm(completeTaskSchema, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors, parsed.formError);
  const { taskId, date, costCents, receiptUrl, notes } = parsed.data;

  const existing = await findTask(home.id, taskId);
  if (!existing) return NOT_FOUND;
  if (existing.completedAt) return { ok: false, formError: "This task is already completed" };

  const vendorId = formData.has("vendorId") ? parsed.data.vendorId : existing.vendorId;
  const linkErrors = await checkLinks(home.id, { vendorId });
  if (linkErrors) return invalid(linkErrors);

  const taskUpdate = existing.recurrence
    ? { dueDate: nextDueDate(existing.dueDate, existing.recurrence, date) }
    : { completedAt: date };

  // neon-http has no interactive transactions; batch keeps the two writes together.
  await db.batch([
    db.insert(logEntry).values({
      homeId: home.id,
      taskId: existing.id,
      itemId: existing.itemId,
      title: existing.title,
      date,
      costCents,
      vendorId,
      receiptUrl,
      notes,
    }),
    db
      .update(task)
      .set(taskUpdate)
      .where(and(eq(task.id, existing.id), eq(task.homeId, home.id))),
  ]);
  revalidateTaskPages();
  return { ok: true };
}

/** Log a Repair modal: a log entry with no task. */
export async function logRepair(_prev: TaskActionState, formData: FormData): Promise<Result> {
  const { home } = await getCurrentHome();
  const parsed = parseForm(logRepairSchema, formData);
  if (!parsed.success) return invalid(parsed.fieldErrors, parsed.formError);
  const linkErrors = await checkLinks(home.id, parsed.data);
  if (linkErrors) return invalid(linkErrors);

  await db.insert(logEntry).values({ ...parsed.data, homeId: home.id });
  revalidateTaskPages();
  return { ok: true };
}
