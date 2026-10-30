"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterChipsProps {
  param?: string;
  options: FilterChipOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function FilterChipsInner({
  param = "status",
  options,
  defaultValue,
  value: controlledValue,
  onChange,
  className,
}: FilterChipsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fallbackDefault =
    defaultValue !== undefined ? defaultValue : (options[0]?.value ?? "");
  const urlValue = searchParams?.get(param);
  const activeValue =
    controlledValue !== undefined
      ? controlledValue
      : urlValue !== null && urlValue !== undefined
        ? urlValue
        : fallbackDefault;

  function handleSelect(optionValue: string) {
    if (onChange) {
      onChange(optionValue);
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const isDefault =
      optionValue === "" ||
      (optionValue === fallbackDefault && optionValue.toLowerCase() === "all");

    if (isDefault) {
      params.delete(param);
    } else {
      params.set(param, optionValue);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Filter options"
      className={clsx("flex flex-wrap items-center gap-2", className)}
    >
      {options.map((opt) => {
        const isActive =
          activeValue === opt.value ||
          (!urlValue &&
            controlledValue === undefined &&
            opt.value === fallbackDefault);

        return (
          <button
            key={opt.value || "__all__"}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(opt.value)}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] text-[12px] font-semibold leading-none border transition-colors cursor-pointer whitespace-nowrap",
              isActive
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted border-border hover:text-ink hover:bg-gray-50"
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={clsx(
                  "text-[11px] font-semibold",
                  isActive ? "text-white/85" : "text-muted-2"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChips(props: FilterChipsProps) {
  const fallbackActive =
    props.value ?? props.defaultValue ?? props.options[0]?.value ?? "";
  return (
    <Suspense
      fallback={
        <div
          role="group"
          aria-label="Filter options"
          className={clsx("flex flex-wrap items-center gap-2", props.className)}
        >
          {props.options.map((opt) => {
            const isActive = opt.value === fallbackActive;
            return (
              <button
                key={opt.value || "__all__"}
                type="button"
                aria-pressed={isActive}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] text-[12px] font-semibold leading-none border transition-colors",
                  isActive
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted border-border"
                )}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span
                    className={clsx(
                      "text-[11px] font-semibold",
                      isActive ? "text-white/85" : "text-muted-2"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      }
    >
      <FilterChipsInner {...props} />
    </Suspense>
  );
}

export default FilterChips;
