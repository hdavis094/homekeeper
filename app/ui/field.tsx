import React from "react";
import clsx from "clsx";
import { Input, type InputProps } from "./input";
import { Select, type SelectProps, type SelectOption } from "./select";
import { Textarea, type TextareaProps } from "./textarea";

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string | string[] | null;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  const errorText = Array.isArray(error) ? error[0] : error;

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium text-ink"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !errorText && (
        <p className="text-[12px] text-muted">{hint}</p>
      )}
      {errorText && (
        <p role="alert" className="text-[12px] text-[#DC2626]">
          {errorText}
        </p>
      )}
    </div>
  );
}

export { Input, Select, Textarea };
export type { InputProps, SelectProps, SelectOption, TextareaProps };
export default Field;
