import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import { API_HEADERS, API_PREFIX } from "@/constants/api";
import { TOKEN_COOKIE } from "@/constants/auth";
import { IMAGE_RULES } from "@/constants/products";
import { API_ENDPOINTS } from "@/utils/api-integration";
import { uploadFileName } from "@/utils/product-rules";

/**
 * POST /api/upload — multipart form with one field, "file". Answers `{ key, previewUrl, name }`.
 *
 * Why the upload goes through this app's own server: the storage bucket accepts browser uploads only from a
 * fixed list of sites (CORS). localhost:3000 is on that list; a Vercel address is not, so a direct upload
 * from the deployed build is refused. A server is not subject to CORS, so the browser sends the file here
 * and this handler does the two steps for it:
 *   1. ask the QA API for a signed upload address (with the user's token, read from the cookie);
 *   2. PUT the file to that address.
 * The handler never takes an address from the browser, so it cannot be used to reach any other server.
 * Errors use the same body as the QA API ({ success, message, statusCode }), so the screens handle them alike.
 */
const fail = (statusCode: number, message: string) => NextResponse.json({ success: false, message, statusCode }, { status: statusCode });

/** The extension comes from the checked type, not from the file name (a name may have no dot at all). */
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

interface SignedUrl {
  url: string;
  preview: string;
  filePath: string;
}

interface SignedUrlAnswer {
  data?: { urls?: SignedUrl[] };
}

/** The first signed address of the API's answer, or null when the answer is not what we expect. */
function firstSignedUrl(answer: unknown): SignedUrl | null {
  const urls = (answer as SignedUrlAnswer | null)?.data?.urls;
  const first = Array.isArray(urls) ? urls[0] : undefined;
  return first && typeof first.url === "string" && typeof first.filePath === "string" ? first : null;
}

/** A form that cannot be read (not multipart, cut off) is the caller's fault: 400, not a crash. */
async function readFile(request: NextRequest): Promise<File | null | "unreadable"> {
  try {
    const file = (await request.formData()).get("file");
    return file instanceof File ? file : null;
  } catch {
    return "unreadable";
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return fail(401, "Unauthorized");

  const file = await readFile(request);
  if (file === "unreadable") return fail(400, "invalidRequest");
  if (!file) return fail(400, "fileRequired");
  // The browser already checked type and size; a server must not rely on that.
  if (!(IMAGE_RULES.mimeTypes as readonly string[]).includes(file.type) || file.size > IMAGE_RULES.maxBytes) {
    return fail(400, "invalidImage");
  }
  const name = uploadFileName(file.name);

  // Every failure below becomes a JSON error in the API's shape (never an unhandled 500): the QA API or the
  // storage may not answer, answer something unexpected, or refuse.
  try {
    const signedResponse = await fetch(`${env.apiBaseUrl}${API_PREFIX}${API_ENDPOINTS.upload.signedUrls}`, {
      method: "POST",
      headers: { ...API_HEADERS, "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ location: IMAGE_RULES.uploadLocation, extension: EXTENSIONS[file.type], count: 1, fileName: name }),
    });
    // An expired token (401) or any other refusal is passed on as the API gave it; the browser translates it.
    if (!signedResponse.ok) {
      return new NextResponse(await signedResponse.text(), { status: signedResponse.status, headers: { "Content-Type": "application/json" } });
    }
    const signed = firstSignedUrl(await signedResponse.json());
    if (!signed || signed.filePath.includes(",")) return fail(502, "uploadFailed");

    const stored = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type }, body: await file.arrayBuffer() });
    if (!stored.ok) return fail(502, "uploadFailed");

    return NextResponse.json({ success: true, message: "Success", data: { key: signed.filePath, previewUrl: signed.preview, name } });
  } catch {
    return fail(502, "uploadFailed");
  }
}
