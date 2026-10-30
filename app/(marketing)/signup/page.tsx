import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/ui/auth/auth-form";
import { AuthPanel } from "@/app/ui/auth/auth-panel";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account | HomeKeeper" };

export default async function SignupPage() {
  if (await getSession()) redirect("/home");
  return <AuthPanel title="A little care. A happier home." description="Create your free HomeKeeper account and keep your home's upkeep in one place."><AuthForm mode="signup" /></AuthPanel>;
}
