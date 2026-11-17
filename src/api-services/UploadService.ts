import { apiClient } from "./CoreAPIService";
import { API_ENDPOINTS } from "./endpoints";
import { ApiError } from "@/types/api";
import { getApiMessage } from "@/utils/api-messages";
import { PRODUCT_RULES, PRODUCT_UPLOAD_LOCATION } from "@/utils/constants";

// Image upload in two steps (same flow as talking-club-admin-frontend src/utils/fileUpload.ts):
//  1. POST /utils/upload-file-urls { location, extension, count: 1, fileName } → data.urls[0] = { url, preview, filePath }
//  2. PUT the file body to the signed S3 `url` with its Content-Type (no auth header — different origin)
// The product API wants `filePath` (S3 key); the screen shows `preview` (public URL).

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

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Client check before uploading: type + size (design 8.1.1). Returns an English message or null. */
export function validateImageFile(file: File): string | null {
  const { accept, acceptExtensions, maxSizeMB } = PRODUCT_RULES.images;
  const extension = extensionOf(file.name);
  if (!accept.includes(file.type) && !acceptExtensions.includes(extension)) {
    return `"${file.name}" is not a supported image. Use ${acceptExtensions.join(", ").toUpperCase()}.`;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `"${file.name}" is larger than ${maxSizeMB} MB.`;
  }
  return null;
}

const UploadService = {
  /** Uploads one file and returns { filePath, preview }. Throws ApiError on any failure. */
  async uploadFile(file: File, location: string = PRODUCT_UPLOAD_LOCATION): Promise<UploadedFile> {
    const extension = extensionOf(file.name) || "png";
    const res = await apiClient.post<{ urls: SignedUploadUrl[] }, UploadUrlsBody>(API_ENDPOINTS.UTILS.UPLOAD_URLS, {
      location,
      extension,
      count: 1,
      fileName: file.name,
    });
    const signed = res.data?.urls?.[0];
    if (!signed?.url || !signed.filePath) {
      throw new ApiError({ status: 0, kind: "server", messageKey: "uploadFailed", message: getApiMessage("uploadFailed") });
    }

    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(signed.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
    } catch {
      throw new ApiError({ status: 0, kind: "network", messageKey: "uploadFailed", message: getApiMessage("uploadFailed") });
    }
    if (!uploadResponse.ok) {
      throw new ApiError({
        status: uploadResponse.status,
        kind: "server",
        messageKey: "uploadFailed",
        message: getApiMessage("uploadFailed"),
      });
    }
    return { filePath: signed.filePath, preview: signed.preview };
  },
};

export default UploadService;
