import React from "react";
import clsx from "clsx";

export type StatCardTone =
  | "default"
  | "ink"
  | "overdue"
  | "danger"
  | "completed"
  | "good"
  | "success"
  | "primary"
  | "scheduled"
  | "due_soon"
  | "warning";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: StatCardTone;
  className?: string;
}

const toneColorMap: Record<StatCardTone, string> = {
  default: "text-ink",
  ink: "text-ink",
  overdue: "text-[#DC2626]",
  danger: "text-[#DC2626]",
  completed: "text-[#16A34A]",
  good: "text-[#16A34A]",
  success: "text-[#16A34A]",
  primary: "text-[#2563EB]",
  scheduled: "text-[#2563EB]",
  due_soon: "text-[#D97706]",
  warning: "text-[#D97706]",
};

export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        "bg-card border border-border rounded-[12px] p-5 flex flex-col justify-between gap-1.5",
        className
      )}
    >
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <div
        className={clsx(
          "text-[30px] font-bold leading-tight tracking-tight",
          toneColorMap[tone] ?? "text-ink"
        )}
      >
        {value}
      </div>
      {sublabel !== undefined && sublabel !== null && (
        <div className="text-[13px] font-normal text-muted">{sublabel}</div>
      )}
    </div>
  );
}

export default StatCard;
