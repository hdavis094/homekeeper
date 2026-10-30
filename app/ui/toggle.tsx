"use client";

import React, { useId, useState } from "react";
import clsx from "clsx";

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  comingSoon?: boolean;
  hint?: React.ReactNode;
  className?: string;
}

export function Toggle({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  name,
  id,
  label,
  description,
  disabled = false,
  comingSoon,
  hint,
  className,
}: ToggleProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);

  const isChecked =
    controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;

  const showComingSoon = comingSoon ?? disabled;
  const badgeText = hint ?? (showComingSoon ? "Coming soon" : null);

  function handleToggle() {
    if (disabled) return;
    const next = !isChecked;
    if (controlledChecked === undefined) {
      setUncontrolledChecked(next);
    }
    onChange?.(next);
  }

  const switchButton = (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={isChecked ? "true" : "false"}
        />
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={typeof label === "string" ? label : undefined}
        disabled={disabled}
        onClick={handleToggle}
        className={clsx(
          "relative inline-flex w-[40px] h-[22px] shrink-0 rounded-[20px] p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          isChecked ? "bg-primary" : "bg-[#E5E7EB]",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            "inline-block w-[18px] h-[18px] rounded-full bg-white shadow-xs transition-transform",
            isChecked ? "translate-x-[18px]" : "translate-x-0"
          )}
        />
      </button>
    </>
  );

  if (!label && !description && !badgeText) {
    return switchButton;
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        {label && (
          <div className="flex items-center gap-2">
            <label
              htmlFor={switchId}
              className={clsx(
                "text-[14px] font-semibold text-ink",
                disabled ? "text-muted cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {label}
            </label>
            {badgeText && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] bg-bg text-muted text-[11px] font-semibold">
                {badgeText}
              </span>
            )}
          </div>
        )}
        {!label && badgeText && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] bg-bg text-muted text-[11px] font-semibold">
            {badgeText}
          </span>
        )}
        {description && (
          <p className="text-[13px] text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {switchButton}
      </div>
    </div>
  );
}

export default Toggle;
