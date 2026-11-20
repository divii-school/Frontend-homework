import { api } from '@/lib/api/client';
import { isObject, pickArray, pickString, unwrapData } from '@/lib/api/normalize';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './types';

export function validateImage(file: File): string {
  if (!IMAGE_TYPES.includes(file.type)) return 'PNG, JPG, WEBP 이미지만 등록할 수 있습니다.';
  if (file.size > MAX_IMAGE_BYTES) return '이미지는 4MB 이하만 등록할 수 있습니다.';
  return '';
}

function findSigned(body: unknown): { url: string; key?: string } | null {
  const d = unwrapData(body);
  const list = Array.isArray(d) ? d : pickArray(d, ['urls', 'data', 'signedUrls', 'list']);
  const first = list[0] ?? d;
  if (typeof first === 'string') return { url: first };
  if (isObject(first)) {
    const url = pickString(first, ['url', 'signedUrl', 'uploadUrl', 'presignedUrl']);
    if (url) return { url, key: pickString(first, ['filePath', 'key', 'path', 'fileKey']) };
  }
  return null;
}

/**
 * 1) ask the API for a signed S3 URL, 2) send the file to our /api/upload route,
 * which PUTs it to S3 server-side (the bucket's CORS blocks a browser PUT from
 * vercel.app), 3) return the key for the product DTO.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const extension = (file.name.split('.').pop() ?? 'png').toLowerCase();
  const signed = findSigned(
    await api.post('/utils/upload-file-urls', { location: 'products', extension, count: 1, fileName: file.name }, false),
  );
  if (!signed) throw new Error('업로드 URL을 받지 못했습니다.');
  const form = new FormData();
  form.append('url', signed.url);
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: form });
  } catch {
    throw new Error('네트워크 연결을 확인해 주세요.');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || '이미지 업로드에 실패했습니다.');
  }
  return signed.key ?? decodeURIComponent(new URL(signed.url).pathname.replace(/^\//, ''));
}
