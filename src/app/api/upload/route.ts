import { NextResponse, type NextRequest } from 'next/server';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/features/products/types';

/**
 * Server-side PUT of a product image to its signed S3 URL.
 * The talking-club S3 bucket's CORS only allows the original admin origin (and
 * localhost:3000), so a browser PUT from *.vercel.app is blocked. The browser
 * still asks the API for the signed URL; only the byte upload runs here.
 */
const S3_HOST = /^[a-z0-9.-]+\.s3[.-][a-z0-9.-]*amazonaws\.com$/;

function fail(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const url = form?.get('url');
  if (!(file instanceof File) || typeof url !== 'string') return fail(400, '업로드할 파일이 없습니다.');

  // Only forward to a signed S3 URL, never to any other host.
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return fail(400, '업로드 URL이 올바르지 않습니다.');
  }
  if (target.protocol !== 'https:' || !S3_HOST.test(target.hostname)) return fail(400, '업로드 URL이 올바르지 않습니다.');

  // Never trust the browser: check type and size again.
  if (!IMAGE_TYPES.includes(file.type)) return fail(400, 'PNG, JPG, WEBP 이미지만 등록할 수 있습니다.');
  if (file.size > MAX_IMAGE_BYTES) return fail(400, '이미지는 4MB 이하만 등록할 수 있습니다.');

  try {
    const put = await fetch(target, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!put.ok) return fail(502, '이미지 업로드에 실패했습니다.');
  } catch {
    return fail(502, '이미지 업로드에 실패했습니다.');
  }
  return NextResponse.json({ success: true });
}
