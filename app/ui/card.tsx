import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className,
  padding = "md",
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-card border border-border rounded-[12px]",
        paddingMap[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
