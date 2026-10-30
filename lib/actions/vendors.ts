"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendor } from "@/lib/db/schema";
import { getCurrentHome } from "@/lib/session";
import { parseForm } from "@/lib/validation/form";
import { vendorSchema } from "@/lib/validation/vendor";

function extractFormData(...args: unknown[]): FormData {
  for (let i = args.length - 1; i >= 0; i--) {
    const a = args[i];
    if (a instanceof FormData) return a;
  }
  // Allow plain objects (tests) by converting to FormData.
  const last = args[args.length - 1];
  if (last && typeof last === "object" && !(last instanceof FormData)) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(last as Record<string, unknown>)) {
      if (v === null || v === undefined) continue;
      fd.set(k, String(v));
    }
    return fd;
  }
  return new FormData();
}

export async function createVendor(...args: unknown[]) {
  const { home } = await getCurrentHome();
  const formData = extractFormData(...args);
  const parsed = parseForm(vendorSchema, formData);
  if (!parsed.success) return parsed;

  const data = parsed.data;
  await db.insert(vendor).values({
    homeId: home.id,
    name: data.name,
    trade: data.trade,
    phone: data.phone,
    email: data.email,
    rating: data.rating,
    notes: data.notes,
  });

  try { revalidatePath("/vendors"); } catch { /* outside request context (tests) */ }
  return { success: true as const };
}

export async function updateVendor(...args: unknown[]) {
  const { home } = await getCurrentHome();
  // id may be passed as first positional arg or inside the form data.
  let id: string | null = null;
  for (const a of args) {
    if (typeof a === "string") {
      id = a;
      break;
    }
  }
  const formData = extractFormData(...args);
  if (!id) {
    id = formData.get("id") ? String(formData.get("id")) : null;
  }
  if (!id) {
    return { success: false as const, fieldErrors: {}, formError: "Missing vendor id" };
  }

  const parsed = parseForm(vendorSchema, formData);
  if (!parsed.success) return parsed;

  const data = parsed.data;
  const updated = await db
    .update(vendor)
    .set({
      name: data.name,
      trade: data.trade,
      phone: data.phone,
      email: data.email,
      rating: data.rating,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(vendor.id, id), eq(vendor.homeId, home.id)))
    .returning({ id: vendor.id });

  if (updated.length === 0) {
    return { success: false as const, fieldErrors: {}, formError: "Vendor not found" };
  }

  try { revalidatePath("/vendors"); } catch { /* outside request context (tests) */ }
  return { success: true as const };
}

export async function deleteVendor(...args: unknown[]) {
  const { home } = await getCurrentHome();
  let id: string | null = null;
  for (const a of args) {
    if (typeof a === "string") {
      id = a;
      break;
    }
  }
  const formData = extractFormData(...args);
  if (!id) {
    id = formData.get("id") ? String(formData.get("id")) : null;
  }
  if (!id) return;

  await db
    .delete(vendor)
    .where(and(eq(vendor.id, id), eq(vendor.homeId, home.id)));

  try { revalidatePath("/vendors"); } catch { /* outside request context (tests) */ }
}
