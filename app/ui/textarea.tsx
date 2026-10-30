import React, { useId } from "react";
import clsx from "clsx";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string | string[] | null;
  hint?: React.ReactNode;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 3,
  className,
  wrapperClassName,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorText = Array.isArray(error) ? error[0] : error;

  const textareaElement = (
    <textarea
      id={textareaId}
      rows={rows}
      aria-invalid={Boolean(errorText) || undefined}
      aria-describedby={errorText ? `${textareaId}-error` : undefined}
      className={clsx(
        "w-full p-3 bg-card border rounded-[8px] text-[14px] text-ink placeholder:text-muted-2 focus:outline-none focus:ring-2 transition-colors disabled:bg-bg disabled:text-muted disabled:cursor-not-allowed",
        errorText
          ? "border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
          : "border-border focus:ring-primary/20 focus:border-primary",
        className
      )}
      {...rest}
    />
  );

  if (!label && !errorText && !hint) {
    return textareaElement;
  }

  return (
    <div className={clsx("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      )}
      {textareaElement}
      {hint && !errorText && (
        <p className="text-[12px] text-muted">{hint}</p>
      )}
      {errorText && (
        <p id={`${textareaId}-error`} className="text-[12px] text-[#DC2626]">
          {errorText}
        </p>
      )}
    </div>
  );
}

export default Textarea;
