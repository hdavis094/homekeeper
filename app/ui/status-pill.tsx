import React from "react";
import clsx from "clsx";

export type StatusPillTone =
  | "overdue"
  | "danger"
  | "due_soon"
  | "needs_service"
  | "needs_attention"
  | "needs attention"
  | "warning"
  | "scheduled"
  | "info"
  | "completed"
  | "good"
  | "success"
  | "plumbing"
  | "electrical"
  | "hvac"
  | "landscaping"
  | "general"
  | "neutral";

export interface StatusPillProps {
  status?: StatusPillTone;
  tone?: StatusPillTone;
  variant?: StatusPillTone;
  dot?: boolean;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

const pillStyles: Record<
  StatusPillTone,
  { fg: string; bg: string; dot: string; defaultLabel: string }
> = {
  overdue: {
    fg: "text-[#DC2626]",
    bg: "bg-[#FEE2E2]",
    dot: "bg-[#DC2626]",
    defaultLabel: "Overdue",
  },
  danger: {
    fg: "text-[#DC2626]",
    bg: "bg-[#FEE2E2]",
    dot: "bg-[#DC2626]",
    defaultLabel: "Danger",
  },
  due_soon: {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Due Soon",
  },
  needs_service: {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Needs Service",
  },
  needs_attention: {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Needs Attention",
  },
  "needs attention": {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Needs Attention",
  },
  warning: {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Needs Attention",
  },
  scheduled: {
    fg: "text-[#2563EB]",
    bg: "bg-[#DBEAFE]",
    dot: "bg-[#2563EB]",
    defaultLabel: "Scheduled",
  },
  info: {
    fg: "text-[#2563EB]",
    bg: "bg-[#DBEAFE]",
    dot: "bg-[#2563EB]",
    defaultLabel: "Scheduled",
  },
  completed: {
    fg: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    dot: "bg-[#16A34A]",
    defaultLabel: "Completed",
  },
  good: {
    fg: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    dot: "bg-[#16A34A]",
    defaultLabel: "Good",
  },
  success: {
    fg: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    dot: "bg-[#16A34A]",
    defaultLabel: "Good",
  },
  plumbing: {
    fg: "text-[#2563EB]",
    bg: "bg-[#DBEAFE]",
    dot: "bg-[#2563EB]",
    defaultLabel: "Plumbing",
  },
  electrical: {
    fg: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    defaultLabel: "Electrical",
  },
  hvac: {
    fg: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    dot: "bg-[#16A34A]",
    defaultLabel: "HVAC",
  },
  landscaping: {
    fg: "text-[#16A34A]",
    bg: "bg-[#DCFCE7]",
    dot: "bg-[#16A34A]",
    defaultLabel: "Landscaping",
  },
  general: {
    fg: "text-[#6B7280]",
    bg: "bg-[#F3F4F6]",
    dot: "bg-[#6B7280]",
    defaultLabel: "General",
  },
  neutral: {
    fg: "text-[#6B7280]",
    bg: "bg-[#F3F4F6]",
    dot: "bg-[#6B7280]",
    defaultLabel: "General",
  },
};

export function StatusPill({
  status,
  tone,
  variant,
  dot = false,
  label,
  children,
  className,
}: StatusPillProps) {
  const key = status ?? tone ?? variant ?? "general";
  const config = pillStyles[key] ?? pillStyles.general;
  const content = children ?? label ?? config.defaultLabel;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] text-[12px] font-semibold leading-none whitespace-nowrap",
        config.bg,
        config.fg,
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={clsx("w-1.5 h-1.5 rounded-full shrink-0", config.dot)}
        />
      )}
      {content}
    </span>
  );
}

export default StatusPill;
