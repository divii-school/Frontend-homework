/**
 * Image upload rules. Shared by the form (checks before upload) and the
 * /api/upload route (checks again on the server), so both always agree.
 */
export const IMAGE_UPLOAD = {
  /** MIME type → file extension sent to POST /utils/upload-file-urls. */
  allowedTypes: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  } as Record<string, string>,
  /**
   * 4 MB. Vercel refuses request bodies above 4.5 MB, and the upload passes through
   * our /api/upload route, so anything larger could never succeed when deployed.
   */
  maxBytes: 4 * 1024 * 1024,
  /** Most images one product may have (Figma 8.1.1: "최대 4장까지 등록 가능"). */
  maxCount: 4,
  /** Folder the API puts product images in (matches existing keys "products/..."). */
  location: 'products',
} as const;

export const ACCEPT_ATTRIBUTE = Object.keys(IMAGE_UPLOAD.allowedTypes).join(',');

export type ImageCheckFailure = 'type' | 'size';

/** Returns why a file is not allowed, or null when it is fine. */
export function checkImageFile(file: { type: string; size: number }): ImageCheckFailure | null {
  if (!(file.type in IMAGE_UPLOAD.allowedTypes)) return 'type';
  if (file.size > IMAGE_UPLOAD.maxBytes) return 'size';
  return null;
}
