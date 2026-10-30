import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { IconTile, type IconTileTone } from "./icon-tile";

export interface ListRowProps {
  iconTile?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: IconTileTone;
  status?: IconTileTone;
  title: React.ReactNode;
  meta?: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  className?: string;
}

export function ListRow({
  iconTile,
  icon,
  tone,
  status,
  title,
  meta,
  subtitle,
  trailing,
  action,
  href,
  onClick,
  className,
}: ListRowProps) {
  const resolvedMeta = meta ?? subtitle;
  const resolvedTrailing = trailing ?? action;
  const resolvedTile =
    iconTile !== undefined ? (
      iconTile
    ) : (
      <IconTile tone={tone ?? status ?? "default"}>{icon}</IconTile>
    );

  const inner = (
    <>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {resolvedTile}
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink truncate">
            {title}
          </div>
          {resolvedMeta && (
            <div className="text-[13px] font-normal text-muted truncate mt-0.5">
              {resolvedMeta}
            </div>
          )}
        </div>
      </div>
      {resolvedTrailing && (
        <div className="flex items-center gap-3 shrink-0">
          {resolvedTrailing}
        </div>
      )}
    </>
  );

  const baseClasses = clsx(
    "flex items-center justify-between gap-4 py-3.5 px-5 border-b border-divider last:border-b-0 transition-colors",
    (href || onClick) && "hover:bg-bg/50 cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={baseClasses}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent<HTMLElement>);
          }
        }}
        className={baseClasses}
      >
        {inner}
      </div>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
}

export default ListRow;
