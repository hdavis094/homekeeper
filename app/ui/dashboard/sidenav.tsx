"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { NavLinks } from "./nav-links";
import { Avatar } from "../avatar";

export interface SideNavUser {
  name: string;
  address: string | null;
  image: string | null;
}

export interface SideNavProps {
  user?: SideNavUser;
  signOut?: () => Promise<void>;
}

const defaultUser: SideNavUser = {
  name: "Alex Morgan",
  address: "123 Maple St.",
  image: null,
};

async function noopSignOut() {}

export function SideNav({
  user = defaultUser,
  signOut = noopSignOut,
}: SideNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar (< 768px) */}
      <div className="md:hidden bg-sidebar text-white">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-[8px] bg-primary shrink-0"
            />
            <span className="text-[18px] font-bold text-white tracking-tight">
              HomeKeeper
            </span>
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 rounded-[8px] text-muted-2 hover:text-white hover:bg-sidebar-active transition-colors cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <nav
            aria-label="Mobile Main"
            className="px-4 pb-4 pt-2 border-t border-sidebar-active flex flex-col gap-4"
          >
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="bg-sidebar-active rounded-[8px] p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name={user.name}
                  image={user.image}
                  size="sm"
                  tone="primary"
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">
                    {user.name}
                  </div>
                  {user.address && (
                    <div className="text-[11px] text-muted-2 truncate">
                      {user.address}
                    </div>
                  )}
                </div>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-1.5 rounded-[8px] text-muted-2 hover:text-white hover:bg-sidebar transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </nav>
        )}
      </div>

      {/* Desktop fixed 240px sidebar (>= 768px) */}
      <aside
        aria-label="Sidebar"
        className="hidden md:flex w-[240px] shrink-0 bg-sidebar text-white flex-col justify-between p-5 min-h-screen select-none"
      >
        <div>
          <Link href="/home" className="flex items-center gap-3 mb-8 px-0.5">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-[8px] bg-primary shrink-0"
            />
            <span className="text-[18px] font-bold text-white tracking-tight">
              HomeKeeper
            </span>
          </Link>

          <nav aria-label="Main">
            <NavLinks />
          </nav>
        </div>

        <div className="bg-sidebar-active rounded-[8px] p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={user.name}
              image={user.image}
              size="sm"
              tone="primary"
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white leading-tight truncate">
                {user.name}
              </div>
              {user.address && (
                <div className="text-[11px] text-muted-2 leading-tight truncate mt-0.5">
                  {user.address}
                </div>
              )}
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 rounded-[8px] text-muted-2 hover:text-white hover:bg-sidebar transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

export default SideNav;
