import { apiClient, kindFromStatus, redirectToLogin } from "./CoreAPIService";
import { API_ENDPOINTS } from "./endpoints";
import { ApiError, type UploadRouteResponse } from "@/types/api";
import { getApiMessage } from "@/utils/api-messages";
import { PRODUCT_RULES, PRODUCT_UPLOAD_LOCATION } from "@/utils/constants";
import { checkImageFile, extensionOf, safeFileName } from "@/utils/image-file";

// Image upload in two requests from the browser:
//  1. POST /utils/upload-file-urls { location, extension, count: 1, fileName } → data.urls[0] = { url, preview, filePath }
//  2. POST /api/upload (this app's own server route) with the file + the signed S3 `url`;
//     the route PUTs the file to S3 from the server.
// Why not PUT to S3 straight from the browser: the bucket's CORS accepts only http://localhost:3000,
// so the upload failed on every other address (Vercel). A server-side request has no CORS.
// The product API wants `filePath` (S3 key); the screen shows `preview` (public URL).

/** Same origin as the app, so the browser sends the session cookie along by itself. */
const UPLOAD_ROUTE = "/api/upload";

export interface UploadedFile {
  /** S3 key — send this to POST/PUT /products. */
  filePath: string;
  /** Public URL — use it for <img src>. */
  preview: string;
}

interface SignedUploadUrl {
  url: string;
  preview: string;
  filePath: string;
}

interface UploadUrlsBody {
  location: string;
  extension: string;
  count: number;
  fileName: string;
}

/** Client check before uploading: type + size (design 8.1.1). Returns an English message or null. */
export function validateImageFile(file: File): string | null {
  const { acceptExtensions, maxSizeMB } = PRODUCT_RULES.images;
  const problem = checkImageFile(file);
  if (problem === "type") {
    return `"${file.name}" is not a supported image. Use ${acceptExtensions.join(", ").toUpperCase()}.`;
  }
  if (problem === "size") {
    return `"${file.name}" is larger than ${maxSizeMB} MB.`;
  }
  return null;
}

const UploadService = {
  /** Uploads one file and returns { filePath, preview }. Throws ApiError on any failure. */
  async uploadFile(file: File, location: string = PRODUCT_UPLOAD_LOCATION): Promise<UploadedFile> {
    // The name without commas goes to the API (it becomes the end of the S3 key) and to the upload route
    const fileName = safeFileName(file.name);
    const extension = extensionOf(fileName) || "png";
    const res = await apiClient.post<{ urls: SignedUploadUrl[] }, UploadUrlsBody>(API_ENDPOINTS.UTILS.UPLOAD_URLS, {
      location,
      extension,
      count: 1,
      fileName,
    });
    const signed = res.data?.urls?.[0];
    if (!signed?.url || !signed.filePath) {
      throw new ApiError({ status: 0, kind: "server", messageKey: "uploadFailed", message: getApiMessage("uploadFailed") });
    }

    // The file and the signed URL go to our own server route as one multipart form
    const form = new FormData();
    form.append("url", signed.url);
    form.append("file", file, fileName);

    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(UPLOAD_ROUTE, { method: "POST", body: form });
    } catch {
      throw new ApiError({ status: 0, kind: "network", messageKey: "uploadFailed", message: getApiMessage("uploadFailed") });
    }

    // Success is only our own JSON { ok: true }. Anything else is a failure — also an answer that is not
    // JSON at all (for example the host's own "request too large" page).
    const answer = (await uploadResponse.json().catch(() => null)) as UploadRouteResponse | null;
    if (!uploadResponse.ok || !answer?.ok) {
      const status = uploadResponse.status;
      // 413 can come from the host before the route runs (Vercel: body above 4.5 MB) → always the "too large" text
      const messageKey = status === 413 ? "uploadTooLarge" : answer && !answer.ok ? answer.message : "uploadFailed";
      // The route found no valid session cookie → same as a 401 from the API: go to the login page
      if (status === 401) redirectToLogin();
      throw new ApiError({ status, kind: kindFromStatus(status, messageKey), messageKey, message: getApiMessage(messageKey) });
    }
    return { filePath: signed.filePath, preview: signed.preview };
  },
};

export default UploadService;
