import { z } from "zod";
import { checkbox, emailField, passwordField, requiredText } from "./fields";

const MISMATCH = "Passwords don't match";

/** Runs the match check even when other fields failed, so every error shows at once. */
const passwordsMatch = {
  path: ["confirmPassword"],
  message: MISMATCH,
  when: (payload: { value: unknown }) => {
    const v = payload.value as { password?: unknown; confirmPassword?: unknown };
    return typeof v?.password === "string" && typeof v?.confirmPassword === "string";
  },
};

function withoutConfirmation<T extends { confirmPassword: string }>(v: T): Omit<T, "confirmPassword"> {
  const rest: Partial<T> = { ...v };
  delete rest.confirmPassword;
  return rest as Omit<T, "confirmPassword">;
}

export const signUpSchema = z
  .object({
    name: requiredText("Name", 80),
    email: emailField,
    password: passwordField(),
    confirmPassword: z.string({ error: "Confirm your password" }),
  })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch)
  .transform(withoutConfirmation);
export type SignUpInput = z.output<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailField,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
  rememberMe: checkbox,
});
export type SignInInput = z.output<typeof signInSchema>;

export const requestResetSchema = z.object({ email: emailField });
export type RequestResetInput = z.output<typeof requestResetSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string({ error: "Reset link is invalid" }).min(1, "Reset link is invalid"),
    password: passwordField("New password"),
    confirmPassword: z.string({ error: "Confirm your password" }),
  })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch)
  .transform(withoutConfirmation);
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>;
