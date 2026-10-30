import React from "react";
import { SideNav } from "@/app/ui/dashboard/sidenav";

// TODO(orchestrator): wire session + signOut
const fakeUser = {
  name: "Alex Morgan",
  address: "123 Maple St.",
  image: null,
};

async function fakeSignOut() {
  "use server";
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
      <SideNav user={fakeUser} signOut={fakeSignOut} />
      <main className="flex-1 bg-bg p-5 md:p-[40px] min-w-0">{children}</main>
    </div>
  );
}
