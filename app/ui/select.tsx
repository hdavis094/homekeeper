import React, { useId } from "react";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string | string[] | null;
  hint?: React.ReactNode;
  options?: SelectOption[];
  wrapperClassName?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  id,
  children,
  className,
  wrapperClassName,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorText = Array.isArray(error) ? error[0] : error;

  const selectElement = (
    <select
      id={selectId}
      aria-invalid={Boolean(errorText) || undefined}
      aria-describedby={errorText ? `${selectId}-error` : undefined}
      className={clsx(
        "h-10 w-full px-3 bg-card border rounded-[8px] text-[14px] text-ink focus:outline-none focus:ring-2 transition-colors disabled:bg-bg disabled:text-muted disabled:cursor-not-allowed",
        errorText
          ? "border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
          : "border-border focus:ring-primary/20 focus:border-primary",
        className
      )}
      {...rest}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );

  if (!label && !errorText && !hint) {
    return selectElement;
  }

  return (
    <div className={clsx("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      )}
      {selectElement}
      {hint && !errorText && (
        <p className="text-[12px] text-muted">{hint}</p>
      )}
      {errorText && (
        <p id={`${selectId}-error`} className="text-[12px] text-[#DC2626]">
          {errorText}
        </p>
      )}
    </div>
  );
}

export default Select;
