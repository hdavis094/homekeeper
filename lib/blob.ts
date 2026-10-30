// Vercel Blob helpers. `uploadFile` runs in the browser (client upload through /api/upload);
// `deleteBlob` runs on the server (needs BLOB_READ_WRITE_TOKEN).
import { upload } from "@vercel/blob/client";

export const UPLOAD_KINDS = ["receipts", "avatars"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_CONTENT_TYPES: Record<UploadKind, string[]> = {
  receipts: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"],
  avatars: ["image/jpeg", "image/png", "image/webp"],
};
/** For `<input type="file" accept={UPLOAD_ACCEPT[kind]}>`. */
export const UPLOAD_ACCEPT: Record<UploadKind, string> = {
  receipts: UPLOAD_CONTENT_TYPES.receipts.join(","),
  avatars: UPLOAD_CONTENT_TYPES.avatars.join(","),
};

/**
 * Client-side: uploads a receipt or avatar and returns its public URL. Save the URL with a server
 * action (log entry `receiptUrl`, user `image`). Throws on a disallowed type or a file over 10 MB.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<{ url: string; pathname: string }> {
  if (file.size > UPLOAD_MAX_BYTES) throw new Error("File is larger than 10 MB");
  if (!UPLOAD_CONTENT_TYPES[kind].includes(file.type)) {
    throw new Error(kind === "avatars" ? "Use a JPG, PNG or WebP image" : "Use an image or a PDF");
  }
  const safeName = file.name.replace(/[^\w.\-]+/g, "-").slice(-80) || "file";
  const blob = await upload(`${kind}/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: file.type,
  });
  return { url: blob.url, pathname: blob.pathname };
}

/**
 * Server-side, best-effort: deletes a blob by URL. Ignores non-Blob URLs and returns false on failure
 * (deleting a missing blob must not block deleting a record or an account).
 */
export async function deleteBlob(url: string | null | undefined): Promise<boolean> {
  if (!url || !/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) return false;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
    return true;
  } catch (error) {
    console.warn("[blob] delete failed", url, error);
    return false;
  }
}
