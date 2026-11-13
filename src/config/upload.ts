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

/** Figma 8.1.1 ⑦: 800×800px is recommended, not required, so a different size only gets a note. */
export const RECOMMENDED_IMAGE_SIZE = 800;

/** Returns a note when an image's pixel size differs from the recommended square, or null. */
export function imageSizeNote(size: { width: number; height: number }): string | null {
  const { width, height } = size;
  if (width === RECOMMENDED_IMAGE_SIZE && height === RECOMMENDED_IMAGE_SIZE) return null;
  const shape = width === height ? '' : ', 정사각형이 아님';
  return `${width}×${height}px${shape} — 권장 크기(${RECOMMENDED_IMAGE_SIZE}×${RECOMMENDED_IMAGE_SIZE}px)와 달라 잘리거나 흐리게 보일 수 있습니다.`;
}
