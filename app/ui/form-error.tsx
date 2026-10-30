import React from "react";
import { AlertCircle } from "lucide-react";
import clsx from "clsx";

export interface FormErrorProps {
  error?: string | string[] | null;
  message?: string | null;
  children?: React.ReactNode;
  className?: string;
}

export function FormError({
  error,
  message,
  children,
  className,
}: FormErrorProps) {
  const errText = Array.isArray(error) ? error.filter(Boolean).join(", ") : error;
  const content = children ?? errText ?? message;

  if (!content) return null;

  return (
    <div
      role="alert"
      className={clsx(
        "flex items-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium",
        className
      )}
    >
      <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
      <span>{content}</span>
    </div>
  );
}

export default FormError;
