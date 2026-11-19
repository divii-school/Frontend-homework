import { PRODUCT_RULES } from "@/utils/constants";

// Image file rules used on BOTH sides of the upload: in the browser before anything is sent
// (UploadService) and again on the server (src/app/api/upload/route.ts). Only plain values in here —
// no browser-only and no server-only API — so both sides can import it.

/** "photo.PNG" → "png"; "" when the name has no extension. */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/**
 * File name without commas (the extension stays): "a,b.png" → "ab.png".
 * Why: the product API stores the image keys as ONE comma-separated list, and the S3 key ends with the
 * file name — a comma inside the name would cut one image into two broken ones after saving.
 * A name that was only commas gets the base name "image".
 */
export function safeFileName(fileName: string): string {
  const cleaned = fileName.replace(/,/g, "");
  return cleaned === "" || cleaned.startsWith(".") ? `image${cleaned}` : cleaned;
}

export type ImageFileProblem = "type" | "size";

/** Type (JPG / PNG / GIF / WEBP by MIME type or extension) and size check. null = the file is fine. */
export function checkImageFile(file: { name: string; type: string; size: number }): ImageFileProblem | null {
  const { accept, acceptExtensions, maxSizeMB } = PRODUCT_RULES.images;
  if (!accept.includes(file.type) && !acceptExtensions.includes(extensionOf(file.name))) return "type";
  if (file.size > maxSizeMB * 1024 * 1024) return "size";
  return null;
}
