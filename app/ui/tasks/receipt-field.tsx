"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { UPLOAD_ACCEPT, uploadFile } from "@/lib/blob";

type Upload =
  | { status: "idle" }
  | { status: "uploading"; name: string }
  | { status: "done"; name: string; url: string }
  | { status: "error"; message: string };

/** Messages `uploadFile` throws before contacting Blob (safe to show as-is). */
const LOCAL_ERRORS = ["File is larger than 10 MB", "Use an image or a PDF"];

/**
 * Optional receipt: uploads to Vercel Blob (`receipts/`) as soon as a file is picked and submits the
 * URL as `receiptUrl`. Uploads can fail (e.g. no Blob token locally); the form still saves without one.
 */
export function ReceiptField({
  error,
  onUploadingChange,
}: {
  error?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<Upload>({ status: "idle" });

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUpload({ status: "uploading", name: file.name });
    onUploadingChange?.(true);
    try {
      const { url } = await uploadFile(file, "receipts");
      setUpload({ status: "done", name: file.name, url });
    } catch (e) {
      const message = e instanceof Error && LOCAL_ERRORS.includes(e.message) ? e.message : null;
      setUpload({
        status: "error",
        message: message
          ? `${message}.`
          : "Couldn't upload the receipt right now. You can save without it and try again later.",
      });
    } finally {
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const message = upload.status === "error" ? upload.message : error;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        Receipt <span className="font-normal text-muted">(optional)</span>
      </label>
      <input type="hidden" name="receiptUrl" value={upload.status === "done" ? upload.url : ""} />
      {upload.status === "done" ? (
        <div className="flex items-center gap-2 h-10 px-3 rounded-[8px] border border-border bg-bg/60 text-[13px]">
          <FileText aria-hidden="true" className="w-4 h-4 text-muted shrink-0" />
          <a href={upload.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
            {upload.name}
          </a>
          <button
            type="button"
            onClick={() => setUpload({ status: "idle" })}
            aria-label="Remove receipt"
            className="ml-auto p-1 rounded-[6px] text-muted hover:text-ink hover:bg-card cursor-pointer"
          >
            <X aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex items-center gap-2 h-10 px-3 rounded-[8px] border border-dashed border-border bg-card text-[13px] text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20"
        >
          {upload.status === "uploading" ? (
            <>
              <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
              <span className="truncate">Uploading {upload.name}…</span>
            </>
          ) : (
            <>
              <Paperclip aria-hidden="true" className="w-4 h-4" />
              <span>Attach a photo or PDF (max 10 MB)</span>
            </>
          )}
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={UPLOAD_ACCEPT.receipts}
            onChange={onChange}
            disabled={upload.status === "uploading"}
            className="sr-only"
          />
        </label>
      )}
      {message && (
        <p role="alert" className="text-[12px] text-[#DC2626]">
          {message}
        </p>
      )}
    </div>
  );
}
