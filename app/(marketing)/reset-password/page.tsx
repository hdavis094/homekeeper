import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/app/ui/auth/auth-form";
import { AuthPanel } from "@/app/ui/auth/auth-panel";
import { FormError } from "@/app/ui/form-error";

export const metadata: Metadata = { title: "Reset password | HomeKeeper", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[]; error?: string | string[] }> }) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : undefined;
  return <AuthPanel title="Choose a new password" description="Use 8–128 characters to keep your HomeKeeper account secure.">
    {!token || query.error ? <div className="mt-4 space-y-4"><FormError error="This reset link is invalid or has expired. Request a new link." /><Link href="/forgot-password" className="block text-center text-[14px] font-semibold text-primary hover:underline">Request a new reset link</Link></div> : <AuthForm mode="reset" token={token} />}
  </AuthPanel>;
}
