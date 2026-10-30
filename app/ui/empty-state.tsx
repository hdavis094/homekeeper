import React from "react";
import clsx from "clsx";

export interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  subtitle,
  icon,
  action,
  children,
  className,
}: EmptyStateProps) {
  const desc = description ?? subtitle;
  const actionSlot = action ?? children;

  return (
    <div
      className={clsx(
        "bg-card border border-border rounded-[12px] p-10 text-center flex flex-col items-center justify-center gap-2",
        className
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-[8px] bg-bg text-muted inline-flex items-center justify-center mb-1">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      {desc && (
        <p className="text-[13px] text-muted max-w-sm">{desc}</p>
      )}
      {actionSlot && <div className="mt-3">{actionSlot}</div>}
    </div>
  );
}

export default EmptyState;
