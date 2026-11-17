import { NextResponse, type NextRequest } from "next/server";
import type { UploadRouteResponse } from "@/types/api";
import { PRODUCT_RULES } from "@/utils/constants";
import { checkImageFile } from "@/utils/image-file";
import { isTokenExpired } from "@/utils/jwt";
import { SESSION_COOKIE_NAME } from "@/utils/session";

// POST /api/upload — the server half of the image upload.
//
// Why it exists: the S3 bucket accepts a browser upload only from http://localhost:3000 (CORS), so on any
// other address (the Vercel link) the upload failed. CORS is a browser rule; a server is not bound by it.
// So the browser sends the file here, and this route PUTs it to the signed S3 URL.
//
// Request: multipart/form-data with
//   url   the signed S3 URL the browser got from POST /utils/upload-file-urls
//   file  the image
// Answer: { ok: true }, or { ok: false, message } with the matching status
//   401 no / expired session · 400 form not readable or not an S3 URL · 415 not an image
//   413 too large · 502 S3 refused the file
// `message` is a key of src/utils/api-messages.ts; UploadService turns it into the text the user sees.

// Node.js runtime (not Edge): the route reads a multipart body of several MB.
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = PRODUCT_RULES.images.maxSizeMB * 1024 * 1024;
/** Room for the multipart boundaries and the `url` field on top of the file itself. */
const FORM_EXTRA_BYTES = 64 * 1024;

function fail(status: number, message: string) {
  return NextResponse.json<UploadRouteResponse>({ ok: false, message }, { status });
}

/**
 * Only https URLs on an Amazon S3 bucket host (<bucket>.s3.<region>.amazonaws.com) are accepted.
 * Without this check the route would send a file to ANY address a caller names (an open proxy).
 */
function isS3UploadUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && hostname.endsWith(".amazonaws.com") && hostname.includes(".s3.");
  } catch {
    return false; // not a URL at all
  }
}

export async function POST(request: NextRequest) {
  // 1. Logged-in session: the same cookie + JWT `exp` check as src/middleware.ts.
  //    A JSON 401, never a redirect: the caller is fetch(), which would read the login page as the answer.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token || isTokenExpired(token)) return fail(401, "sessionExpired");

  // 2. A body that is clearly too big is refused before it is read into memory
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + FORM_EXTRA_BYTES) return fail(413, "uploadTooLarge");

  // 3. Read the form
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "uploadFailed");
  }
  const url = form.get("url");
  const file = form.get("file");
  if (typeof url !== "string" || !(file instanceof File)) return fail(400, "uploadFailed");

  // 4. Never trust the browser: S3 address, file type and size are checked again here
  //    (same rules and constants as the browser check in UploadService.validateImageFile)
  if (!isS3UploadUrl(url)) return fail(400, "uploadUrlNotAllowed");
  const problem = checkImageFile(file);
  if (problem === "type") return fail(415, "fileFormatNotAllowed");
  if (problem === "size") return fail(413, "uploadTooLarge");

  // 5. The same request the browser used to send: PUT the bytes with the file's Content-Type, no auth header
  //    (the signature is inside the URL). redirect "manual": a redirect answer is never followed to another host.
  try {
    const s3Response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
      redirect: "manual",
    });
    if (!s3Response.ok) return fail(502, "uploadFailed");
  } catch {
    return fail(502, "uploadFailed"); // S3 not reachable
  }
  return NextResponse.json<UploadRouteResponse>({ ok: true });
}
