"use client";

import React, { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  param?: string;
  paramValue?: string;
  clearParams?: string[];
  open?: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function ModalInner({
  param,
  paramValue,
  clearParams,
  open: controlledOpen,
  onClose,
  title,
  subtitle,
  footer,
  children,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramCurrentValue = param ? searchParams?.get(param) : null;
  const isUrlOpen = param
    ? paramValue !== undefined
      ? paramCurrentValue === paramValue
      : paramCurrentValue !== null && paramCurrentValue !== ""
    : false;

  const isOpen = controlledOpen !== undefined ? controlledOpen : isUrlOpen;

  const handleClose = useCallback(() => {
    onClose?.();
    if (param || (clearParams && clearParams.length > 0)) {
      const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
      if (param) nextParams.delete(param);
      if (clearParams) {
        for (const p of clearParams) {
          nextParams.delete(p);
        }
      }
      const qs = nextParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [onClose, param, clearParams, searchParams, router, pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    } else if (dialog.open && typeof dialog.close === "function") {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={typeof title === "string" ? title : undefined}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          handleClose();
        }
      }}
      className={clsx(
        "fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] rounded-[12px] bg-card text-ink border border-border p-0 shadow-xl backdrop:bg-ink/40",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-divider">
          <div>
            <h2 className="text-[16px] font-bold text-ink">{title}</h2>
            {subtitle && (
              <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="p-1 rounded-[8px] text-muted hover:text-ink hover:bg-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-divider bg-bg/40 rounded-b-[12px]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

export function Modal(props: ModalProps) {
  return (
    <Suspense fallback={null}>
      <ModalInner {...props} />
    </Suspense>
  );
}

export default Modal;
