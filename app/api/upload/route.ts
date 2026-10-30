import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UPLOAD_CONTENT_TYPES, UPLOAD_KINDS, UPLOAD_MAX_BYTES, type UploadKind } from "@/lib/blob";

/**
 * Client-upload token endpoint for `uploadFile()` in lib/blob.ts. Signed-in users only; pathnames must
 * start with `receipts/` or `avatars/`; images (+ PDF for receipts) up to 10 MB.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Token requests come from the browser with the session cookie.
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new Error("Not signed in");
        const kind = pathname.split("/")[0] as UploadKind;
        if (!UPLOAD_KINDS.includes(kind) || pathname.includes("..")) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: UPLOAD_CONTENT_TYPES[kind],
          maximumSizeInBytes: UPLOAD_MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // Called by Vercel Blob (not the browser) after the upload; the URL is saved by a server action.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: message === "Not signed in" ? 401 : 400 });
  }
}
