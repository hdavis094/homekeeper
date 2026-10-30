import React from "react";
import clsx from "clsx";

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageHeaderProps) {
  const rightSlot = actions ?? children;

  return (
    <header
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[28px] md:text-[30px] font-bold text-ink tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] font-normal text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {rightSlot && (
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {rightSlot}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
