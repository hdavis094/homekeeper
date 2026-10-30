"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import clsx from "clsx";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  param?: string;
  debounceMs?: number;
  onSearchChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

function SearchInputInner({
  param = "q",
  debounceMs = 300,
  placeholder = "Search...",
  defaultValue,
  value: controlledValue,
  onSearchChange,
  onChange,
  className,
  ...rest
}: SearchInputProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams?.get(param) ?? "";
  const initial =
    controlledValue !== undefined
      ? String(controlledValue)
      : defaultValue !== undefined
        ? String(defaultValue)
        : urlQuery;

  const [internalValue, setInternalValue] = useState(initial);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (
    urlQuery !== prevUrlQuery &&
    controlledValue === undefined &&
    defaultValue === undefined
  ) {
    setPrevUrlQuery(urlQuery);
    setInternalValue(urlQuery);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const displayValue =
    controlledValue !== undefined ? String(controlledValue) : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.value;
    setInternalValue(nextVal);
    onChange?.(e);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange?.(nextVal);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (nextVal.trim()) {
        params.set(param, nextVal.trim());
      } else {
        params.delete(param);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, debounceMs);
  }

  return (
    <div className={clsx("relative inline-flex items-center", className)}>
      <Search
        aria-hidden="true"
        className="w-4 h-4 text-muted-2 absolute left-3 pointer-events-none"
      />
      <input
        type="search"
        name={param}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={rest["aria-label"] ?? placeholder}
        className="h-9 w-full min-w-[200px] pl-9 pr-3 bg-card border border-border rounded-[8px] text-[13px] text-ink placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        {...rest}
      />
    </div>
  );
}

export function SearchInput(props: SearchInputProps) {
  const placeholder = props.placeholder ?? "Search...";
  return (
    <Suspense
      fallback={
        <div
          className={clsx("relative inline-flex items-center", props.className)}
        >
          <Search
            aria-hidden="true"
            className="w-4 h-4 text-muted-2 absolute left-3 pointer-events-none"
          />
          <input
            type="search"
            name={props.param ?? "q"}
            defaultValue={
              props.defaultValue !== undefined ? String(props.defaultValue) : ""
            }
            placeholder={placeholder}
            aria-label={props["aria-label"] ?? placeholder}
            readOnly
            className="h-9 w-full min-w-[200px] pl-9 pr-3 bg-card border border-border rounded-[8px] text-[13px] text-ink placeholder:text-muted-2"
          />
        </div>
      }
    >
      <SearchInputInner {...props} />
    </Suspense>
  );
}

export default SearchInput;
