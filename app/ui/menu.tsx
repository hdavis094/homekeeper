"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mail, Phone } from "lucide-react";
import clsx from "clsx";

export interface MenuItem {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface MenuProps {
  label?: React.ReactNode;
  trigger?: React.ReactNode;
  items?: MenuItem[];
  phone?: string | null;
  email?: string | null;
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  buttonClassName?: string;
}

export function Menu({
  label = "Contact",
  trigger,
  items,
  phone,
  email,
  children,
  align = "right",
  className,
  buttonClassName,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const fallbackItems: MenuItem[] = [];
  if (phone) {
    fallbackItems.push({
      label: `Call ${phone}`,
      href: `tel:${phone}`,
      icon: <Phone className="w-3.5 h-3.5 text-muted" />,
    });
  }
  if (email) {
    fallbackItems.push({
      label: `Email ${email}`,
      href: `mailto:${email}`,
      icon: <Mail className="w-3.5 h-3.5 text-muted" />,
    });
  }
  const resolvedItems: MenuItem[] = items ?? fallbackItems;

  return (
    <div
      ref={containerRef}
      className={clsx("relative inline-block w-full", className)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "w-full h-9 px-4 rounded-[8px] bg-card border border-border text-[13px] font-semibold text-primary hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer",
          buttonClassName
        )}
      >
        {trigger ?? label}
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute z-30 mt-1.5 min-w-[180px] rounded-[8px] bg-card border border-border shadow-lg py-1",
            align === "right" && "right-0",
            align === "left" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2"
          )}
        >
          {children
            ? children
            : resolvedItems.map((item, idx) =>
                item.href ? (
                  <a
                    key={idx}
                    role="menuitem"
                    href={item.href}
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-bg transition-colors"
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </a>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-bg transition-colors cursor-pointer"
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              )}
        </div>
      )}
    </div>
  );
}

export default Menu;
