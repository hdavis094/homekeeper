"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { FormError } from "@/app/ui/form-error";
import { requestReset, resetPassword, signIn, signUp } from "@/lib/actions/auth";
import type { AuthFormState } from "@/lib/actions/auth";

type Mode = "login" | "signup" | "forgot" | "reset";
const actions = { login: signIn, signup: signUp, forgot: requestReset, reset: resetPassword };
const labels = { login: "Log In", signup: "Create free account", forgot: "Send reset link", reset: "Reset password" };
const pendingLabels = { login: "Logging in…", signup: "Creating account…", forgot: "Sending reset link…", reset: "Resetting password…" };

export function AuthForm({ mode, token, resetSuccess = false }: { mode: Mode; token?: string; resetSuccess?: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(actions[mode], {});
  const isNewPassword = mode === "signup" || mode === "reset";

  return (
    <form action={action} className="mt-4" aria-busy={pending}>
      <div aria-live="polite" aria-atomic="true">
        {resetSuccess && <p role="status" className="mb-4 rounded-[8px] bg-completed-bg p-3 text-[13px] text-[#166534]">Your password has been reset. Log in with your new password.</p>}
        {state.message && <p role="status" className="rounded-[8px] bg-scheduled-bg p-4 text-[14px] text-[#1E40AF]">{state.message}</p>}
        <FormError error={state.formError} className="mb-4" />
        {state.fieldErrors && <p className="sr-only">Please check the highlighted fields.</p>}
      </div>
      {!state.message && <>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
          {mode === "signup" && <Input label="Full name" name="name" autoComplete="name" required maxLength={80} placeholder="Alex Morgan" defaultValue={state.values?.name} error={state.fieldErrors?.name} />}
          {mode !== "reset" && <Input label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" defaultValue={state.values?.email} error={state.fieldErrors?.email} />}
          {mode !== "forgot" && <Input label={mode === "reset" ? "New password" : "Password"} name="password" type="password" autoComplete={isNewPassword ? "new-password" : "current-password"} required minLength={isNewPassword ? 8 : undefined} maxLength={isNewPassword ? 128 : undefined} placeholder={isNewPassword ? "At least 8 characters" : "••••••••"} error={state.fieldErrors?.password} />}
          {isNewPassword && <Input label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} placeholder="Re-enter your password" error={state.fieldErrors?.confirmPassword} />}
          {mode === "reset" && <input type="hidden" name="token" value={token ?? ""} />}
          {mode === "login" && <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <label className="flex cursor-pointer items-center gap-2 text-muted"><input type="checkbox" name="rememberMe" defaultChecked={state.values?.rememberMe} className="h-4 w-4 accent-primary" />Remember me</label>
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">Forgot password?</Link>
          </div>}
          <Button type="submit" size="lg" className="mt-0.5 w-full">{pending ? pendingLabels[mode] : labels[mode]}</Button>
        </fieldset>
        {mode === "reset" && <Link href="/forgot-password" className="mt-4 block text-center text-[13px] font-semibold text-primary hover:underline">Request a new reset link</Link>}
      </>}
      <p className="mt-4 text-center text-[13px] text-muted">
        {mode === "login" ? <>Don&apos;t have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></>
          : mode === "signup" ? <>Already have an account? <Link href="/#login" className="font-semibold text-primary hover:underline">Log in</Link></>
          : <Link href="/#login" className="font-semibold text-primary hover:underline">← Back to log in</Link>}
      </p>
    </form>
  );
}
