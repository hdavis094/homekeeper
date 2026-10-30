import { issueSignedToken } from "@vercel/blob";
import { type HandleUploadPresignedBody, handleUploadPresigned } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UPLOAD_CONTENT_TYPES, UPLOAD_KINDS, UPLOAD_MAX_BYTES, type UploadKind } from "@/lib/blob";

/**
 * Presigned client-upload endpoint for `uploadFile()` in lib/blob.ts (works with the store's OIDC
 * connection, so no BLOB_READ_WRITE_TOKEN is needed). Signed-in users only; pathnames must
 * start with `receipts/` or `avatars/`; images (+ PDF for receipts) up to 10 MB.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        // Token requests come from the browser with the session cookie.
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new Error("Not signed in");
        const kind = pathname.split("/")[0] as UploadKind;
        if (!UPLOAD_KINDS.includes(kind) || pathname.includes("..")) throw new Error("Invalid upload path");
        const limits = { allowedContentTypes: UPLOAD_CONTENT_TYPES[kind], maximumSizeInBytes: UPLOAD_MAX_BYTES };
        const validUntil = Date.now() + 10 * 60 * 1000;
        const token = await issueSignedToken({ pathname, operations: ["put"], ...limits, validUntil });
        return { token, urlOptions: { ...limits, validUntil, addRandomSuffix: true, allowOverwrite: false } };
      },
      // No onUploadCompleted: the URL is saved by a server action when the form is submitted.
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: message === "Not signed in" ? 401 : 400 });
  }
}
