import type { Metadata } from "next";
import { AuthForm } from "@/app/ui/auth/auth-form";
import { AuthPanel } from "@/app/ui/auth/auth-panel";

export const metadata: Metadata = { title: "Forgot password | HomeKeeper" };

export default function ForgotPasswordPage() {
  return <AuthPanel title="Forgot your password?" description="Enter your email and we'll send you a link to reset your password."><AuthForm mode="forgot" /></AuthPanel>;
}
