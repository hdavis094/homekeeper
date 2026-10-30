import React, { useId } from "react";
import clsx from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string | string[] | null;
  hint?: React.ReactNode;
  wrapperClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className,
  wrapperClassName,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorText = Array.isArray(error) ? error[0] : error;

  const inputElement = (
    <input
      id={inputId}
      aria-invalid={Boolean(errorText) || undefined}
      aria-describedby={errorText ? `${inputId}-error` : undefined}
      className={clsx(
        "h-10 w-full px-3 bg-card border rounded-[8px] text-[14px] text-ink placeholder:text-muted-2 focus:outline-none focus:ring-2 transition-colors disabled:bg-bg disabled:text-muted disabled:cursor-not-allowed read-only:bg-bg read-only:text-muted",
        errorText
          ? "border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
          : "border-border focus:ring-primary/20 focus:border-primary",
        className
      )}
      {...rest}
    />
  );

  if (!label && !errorText && !hint) {
    return inputElement;
  }

  return (
    <div className={clsx("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      )}
      {inputElement}
      {hint && !errorText && (
        <p className="text-[12px] text-muted">{hint}</p>
      )}
      {errorText && (
        <p id={`${inputId}-error`} className="text-[12px] text-[#DC2626]">
          {errorText}
        </p>
      )}
    </div>
  );
}

export default Input;
