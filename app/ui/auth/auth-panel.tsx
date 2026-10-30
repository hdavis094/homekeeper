import type { ReactNode } from "react";
import { Card } from "@/app/ui/card";

export function AuthPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center bg-bg px-5 py-14 sm:py-20">
      <Card padding="none" className="w-full max-w-[440px] p-6 shadow-sm sm:p-8">
        <h1 className="text-[24px] font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-[14px] leading-5 text-muted">{description}</p>
        {children}
      </Card>
    </main>
  );
}
