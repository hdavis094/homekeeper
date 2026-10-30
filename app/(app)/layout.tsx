import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SideNav } from "@/app/ui/dashboard/sidenav";
import { auth } from "@/lib/auth";
import { getCurrentHome } from "@/lib/session";

async function signOut() {
  "use server";
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, home } = await getCurrentHome();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
      <SideNav
        user={{ name: user.name, address: home.address, image: user.image ?? null }}
        signOut={signOut}
      />
      <main className="flex-1 bg-bg p-5 md:p-[40px] min-w-0">{children}</main>
    </div>
  );
}
