"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requestResetSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { parseForm } from "@/lib/validation/form";

export type AuthFormState = {
  fieldErrors?: Record<string, string>;
  formError?: string;
  message?: string;
  values?: { name: string; email: string; rememberMe: boolean };
};

function values(form: FormData): NonNullable<AuthFormState["values"]> {
  return {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    rememberMe: form.get("rememberMe") === "on",
  };
}

export async function signIn(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = parseForm(signInSchema, form);
  const retained = values(form);
  if (!parsed.success) return { ...parsed, values: retained };
  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    return { values: retained, formError: error instanceof APIError && error.status === "UNAUTHORIZED"
      ? "Email or password is incorrect."
      : "We couldn't log you in. Please try again in a moment." };
  }
  redirect("/home");
}

export async function signUp(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = parseForm(signUpSchema, form);
  const retained = values(form);
  if (!parsed.success) return { ...parsed, values: retained };
  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    const exists = error instanceof APIError && error.body?.code?.startsWith("USER_ALREADY_EXISTS");
    return { values: retained, formError: exists
      ? "An account with this email already exists. Log in or reset your password."
      : "We couldn't create your account. Please try again in a moment." };
  }
  redirect("/home");
}

export async function requestReset(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = parseForm(requestResetSchema, form);
  if (!parsed.success) return { ...parsed, values: values(form) };
  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch {
    // Keep the response identical so account existence is never disclosed.
    console.error("[auth] Password reset request could not be completed.");
  }
  return { message: "Check your inbox. If an account exists for this email, we'll send a password reset link." };
}

export async function resetPassword(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = parseForm(resetPasswordSchema, form);
  if (!parsed.success) return parsed;
  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
      headers: await headers(),
    });
    // Reset revokes sessions in the database; also clear the browser's stale cookie
    // so the optimistic proxy lets the success notice reach the login page.
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    return { formError: error instanceof APIError && error.body?.code === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired. Request a new link."
      : "We couldn't reset your password. Please try again in a moment." };
  }
  redirect("/?reset=success");
}
