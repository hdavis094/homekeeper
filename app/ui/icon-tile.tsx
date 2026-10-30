import React from "react";
import clsx from "clsx";
import type { StatusPillTone } from "./status-pill";

export type IconTileTone = StatusPillTone | "default" | "primary";

export interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: IconTileTone;
  status?: IconTileTone;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}

const tileToneClasses: Record<IconTileTone, string> = {
  overdue: "bg-[#FEE2E2] text-[#DC2626]",
  danger: "bg-[#FEE2E2] text-[#DC2626]",
  due_soon: "bg-[#FEF3C7] text-[#D97706]",
  needs_service: "bg-[#FEF3C7] text-[#D97706]",
  needs_attention: "bg-[#FEF3C7] text-[#D97706]",
  "needs attention": "bg-[#FEF3C7] text-[#D97706]",
  warning: "bg-[#FEF3C7] text-[#D97706]",
  electrical: "bg-[#FEF3C7] text-[#D97706]",
  scheduled: "bg-[#DBEAFE] text-[#2563EB]",
  info: "bg-[#DBEAFE] text-[#2563EB]",
  primary: "bg-[#DBEAFE] text-[#2563EB]",
  plumbing: "bg-[#DBEAFE] text-[#2563EB]",
  completed: "bg-[#DCFCE7] text-[#16A34A]",
  good: "bg-[#DCFCE7] text-[#16A34A]",
  success: "bg-[#DCFCE7] text-[#16A34A]",
  hvac: "bg-[#DCFCE7] text-[#16A34A]",
  landscaping: "bg-[#DCFCE7] text-[#16A34A]",
  general: "bg-[#F3F4F6] text-[#6B7280]",
  neutral: "bg-[#F3F4F6] text-[#6B7280]",
  default: "bg-[#F3F4F6] text-[#6B7280]",
};

const sizeClasses = {
  sm: "w-8 h-8 rounded-[8px]",
  md: "w-9 h-9 rounded-[8px]",
  lg: "w-11 h-11 rounded-[10px]",
};

export function IconTile({
  tone,
  status,
  size = "md",
  children,
  className,
  ...rest
}: IconTileProps) {
  const resolvedTone = tone ?? status ?? "default";
  return (
    <div
      aria-hidden={children ? undefined : "true"}
      className={clsx(
        "inline-flex items-center justify-center shrink-0",
        sizeClasses[size],
        tileToneClasses[resolvedTone] ?? tileToneClasses.default,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default IconTile;
