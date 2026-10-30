"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { item } from "@/lib/db/schema";
import { getCurrentHome } from "@/lib/session";
import { parseForm } from "@/lib/validation/form";
import { itemSchema } from "@/lib/validation/item";

export type InventoryActionResult =
  | { success: true; id: string }
  | { success: false; fieldErrors: Record<string, string>; formError?: string };

export async function createItem(formData: FormData): Promise<InventoryActionResult> {
  const { home } = await getCurrentHome();
  const parsed = parseForm(itemSchema, formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.fieldErrors, formError: parsed.formError };
  }
  const [row] = await db
    .insert(item)
    .values({ homeId: home.id, ...parsed.data })
    .returning({ id: item.id });
  try { revalidatePath("/inventory"); } catch {}
  try { revalidatePath("/home"); } catch {}
  return { success: true, id: row.id };
}

export async function updateItem(
  idOrFormData: string | FormData,
  maybeFormData?: FormData,
): Promise<InventoryActionResult> {
  const { home } = await getCurrentHome();
  let id: string;
  let formData: FormData;
  if (idOrFormData instanceof FormData) {
    id = String(idOrFormData.get("id") ?? "");
    formData = idOrFormData;
  } else {
    id = idOrFormData;
    formData = maybeFormData as FormData;
  }
  const parsed = parseForm(itemSchema, formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.fieldErrors, formError: parsed.formError };
  }
  await db
    .update(item)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(item.id, id), eq(item.homeId, home.id)));
  try { revalidatePath("/inventory"); } catch {}
  try { revalidatePath("/home"); } catch {}
  return { success: true, id };
}

export async function deleteItem(input: string | FormData): Promise<{ success: true } | { success: false; formError: string }> {
  const { home } = await getCurrentHome();
  const id = typeof input === "string" ? input : String(input.get("id") ?? "");
  await db.delete(item).where(and(eq(item.id, id), eq(item.homeId, home.id)));
  try { revalidatePath("/inventory"); } catch {}
  try { revalidatePath("/home"); } catch {}
  return { success: true };
}
