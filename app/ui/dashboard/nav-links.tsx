"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export const NAV_ITEMS = [
  { name: "Home", href: "/home" },
  { name: "Tasks", href: "/tasks" },
  { name: "Schedule", href: "/schedule" },
  { name: "Inventory", href: "/inventory" },
  { name: "Vendors", href: "/vendors" },
  { name: "Settings", href: "/settings" },
] as const;

export interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps = {}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "h-9 px-3.5 rounded-[8px] flex items-center gap-3 text-[14px] transition-colors",
              isActive
                ? "bg-sidebar-active text-white font-semibold"
                : "text-muted-2 font-medium hover:bg-sidebar-active/50 hover:text-white"
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isActive ? "bg-primary" : "bg-muted-2"
              )}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default NavLinks;
