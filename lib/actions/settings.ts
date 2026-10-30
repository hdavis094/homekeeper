"use server";

import { z } from "zod";
import { deleteBlob } from "@/lib/blob";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { home, logEntry } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import { parseForm } from "@/lib/validation/form";
import { profileSchema, homeDetailsSchema, notificationsSchema, changePasswordSchema } from "@/lib/validation/settings";

export type SettingsState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function saved(message = "Changes saved."): SettingsState {
  revalidatePath("/", "layout");
  return { success: true, message };
}

export async function updateProfile(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  await requireSession();
  const parsed = parseForm(profileSchema, form);
  if (!parsed.success) return { success: false, fieldErrors: parsed.fieldErrors };
  try {
    await auth.api.updateUser({ headers: await headers(), body: parsed.data });
  } catch {
    return { success: false, message: "We couldn't save your profile. Please try again." };
  }
  return saved();
}

export async function updateHome(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await requireSession();
  const parsed = parseForm(homeDetailsSchema, form);
  if (!parsed.success) return { success: false, fieldErrors: parsed.fieldErrors };
  try {
    await db.update(home).set(parsed.data).where(eq(home.userId, user.id));
  } catch {
    return { success: false, message: "We couldn't save your home details. Please try again." };
  }
  return saved();
}

export async function updateNotifications(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await requireSession();
  const parsed = parseForm(notificationsSchema, form);
  if (!parsed.success) return { success: false, fieldErrors: parsed.fieldErrors };
  try {
    await db.update(home).set(parsed.data).where(eq(home.userId, user.id));
  } catch {
    return { success: false, message: "We couldn't save your preferences. Please try again." };
  }
  return saved("Preferences saved.");
}

export async function changePassword(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  await requireSession();
  const parsed = parseForm(changePasswordSchema, form);
  if (!parsed.success) return { success: false, fieldErrors: parsed.fieldErrors };
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: parsed.data,
    });
  } catch {
    return { success: false, message: "We couldn't update your password. Check your current password and try again." };
  }
  return saved("Password updated.");
}

const avatarSchema = z.object({
  url: z.url().refine((url) => {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname)
      && parsed.pathname.startsWith("/avatars/") && !parsed.search && !parsed.hash;
  }, "Upload a JPG, PNG or WebP photo first."),
});

export async function updateAvatar(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await requireSession();
  const parsed = parseForm(avatarSchema, form);
  if (!parsed.success || !new URL(parsed.data.url).pathname.startsWith(`/avatars/${user.id}-`)) {
    return { success: false, message: "Please upload a photo before saving it." };
  }
  try {
    await auth.api.updateUser({ headers: await headers(), body: { image: parsed.data.url } });
  } catch {
    return { success: false, message: "We couldn't save your photo. Please try again." };
  }
  if (user.image !== parsed.data.url) await deleteBlob(user.image);
  return saved("Profile photo updated.");
}

export async function removeAvatar(): Promise<SettingsState> {
  const { user } = await requireSession();
  try {
    await auth.api.updateUser({ headers: await headers(), body: { image: null } });
  } catch {
    return { success: false, message: "We couldn't remove your photo. Please try again." };
  }
  await deleteBlob(user.image);
  return saved("Profile photo removed.");
}

export async function deleteAccount(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const { user } = await requireSession();
  if (form.get("confirmation") !== "DELETE") {
    return { success: false, fieldErrors: { confirmation: "Type DELETE to confirm." } };
  }
  const receipts = await db.select({ url: logEntry.receiptUrl }).from(logEntry)
    .innerJoin(home, eq(logEntry.homeId, home.id)).where(eq(home.userId, user.id));
  try {
    await auth.api.deleteUser({ headers: await headers(), body: {} });
  } catch {
    return { success: false, message: "We couldn't delete your account. For your security, sign out and sign in again, then retry." };
  }
  // Collect URLs before the cascade; clean up only after account deletion succeeds.
  const urls = new Set([user.image, ...receipts.map(({ url }) => url)]);
  await Promise.allSettled([...urls].map((url) => deleteBlob(url)));
  revalidatePath("/", "layout");
  redirect("/");
}
