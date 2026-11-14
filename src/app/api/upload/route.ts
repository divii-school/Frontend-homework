import { NextResponse, type NextRequest } from 'next/server';
import { IMAGE_UPLOAD, checkImageFile } from '@/config/upload';
import { apiHeaders, apiUrl, upstreamUnreachable } from '@/lib/server/talking-club-proxy';
import type { ApiResponse } from '@/types/api';
import type { SignedUploadUrl, UploadedImage } from '@/types/product';

/**
 * POST /api/upload (multipart, field "file") → returns { filePath, preview }.
 *
 * 1. Checks type and size again (never trust the browser).
 * 2. Asks the API for a signed S3 URL: POST /utils/upload-file-urls.
 * 3. PUTs the bytes to S3 from the server.
 *
 * Step 3 runs here and not in the browser because the S3 bucket's CORS allows only
 * http://localhost:3000; a browser PUT from *.vercel.app is blocked.
 */
function fail(status: number, message: string): NextResponse {
  return NextResponse.json({ success: false, message, data: null, errors: null, statusCode: status }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authorization = request.headers.get('authorization');
  if (!authorization) return fail(401, 'Unauthorized');

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return fail(400, 'fileRequired');

  const problem = checkImageFile(file);
  if (problem === 'type') return fail(400, 'invalidFileType');
  if (problem === 'size') return fail(400, 'fileTooLarge');

  const extension = IMAGE_UPLOAD.allowedTypes[file.type];
  let signed: Response;
  try {
    signed = await fetch(apiUrl('/utils/upload-file-urls'), {
      method: 'POST',
      headers: apiHeaders({ authorization, 'content-type': 'application/json' }),
      body: JSON.stringify({ location: IMAGE_UPLOAD.location, extension, count: 1, fileName: file.name }),
      cache: 'no-store',
    });
  } catch {
    return upstreamUnreachable();
  }
  const signedBody = (await signed.json().catch(() => null)) as ApiResponse<{ urls: SignedUploadUrl[] }> | null;
  if (!signed.ok || !signedBody?.data?.urls?.[0]) {
    return NextResponse.json(signedBody, { status: signed.ok ? 502 : signed.status });
  }

  const target = signedBody.data.urls[0];
  try {
    const put = await fetch(target.url, {
      method: 'PUT',
      headers: { 'content-type': file.type },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!put.ok) return fail(502, 'uploadFailed');
  } catch {
    return fail(502, 'uploadFailed');
  }

  const result: UploadedImage = { filePath: target.filePath, preview: target.preview };
  return NextResponse.json({ success: true, message: 'uploaded', data: result }, { status: 201 });
}
