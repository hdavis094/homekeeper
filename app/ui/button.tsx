import React from "react";
import Link from "next/link";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white border border-transparent hover:bg-blue-700 focus-visible:ring-primary",
  secondary:
    "bg-card text-ink border border-border hover:bg-gray-50 focus-visible:ring-primary",
  ghost:
    "bg-transparent text-muted border border-transparent hover:bg-gray-100 hover:text-ink focus-visible:ring-primary",
  danger:
    "bg-card text-[#DC2626] border border-[#DC2626] hover:bg-[#FEE2E2]/50 focus-visible:ring-[#DC2626]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[8px] gap-1.5",
  md: "h-9 px-4 text-[14px] rounded-[8px] gap-2",
  lg: "h-11 px-5 text-[15px] rounded-[8px] gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;
