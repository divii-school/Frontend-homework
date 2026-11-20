import { z } from "zod";
import { apiRequest, ApiError } from "@/services/http";
import { imagePreviewUrl } from "@/services/productForm";
import type { ProductImage } from "@/types/productForm";

// POST /api/v1/utils/upload-file-urls → { urls: [{ url (signed PUT), preview, filePath }] }
const signedSchema = z.object({
  urls: z.array(z.object({ url: z.string().url(), filePath: z.string(), preview: z.string().optional() })).min(1),
});

/**
 * Uploads one product image:
 * 1. the Talking Club API gives a signed S3 URL (needs our login token);
 * 2. our own route /api/upload PUTs the file to that URL server-side, because the bucket's
 *    CORS only allows the original admin's origin, not ours (checked on QA 2026-11-16).
 */
export async function uploadProductImage(file: File): Promise<ProductImage> {
  const extension = (file.name.split(".").pop() ?? "").toLowerCase() || file.type.split("/")[1] || "png";
  const signed = signedSchema.parse(
    await apiRequest<unknown>("/api/v1/utils/upload-file-urls", {
      method: "POST",
      body: { location: "products", extension, count: 1, fileName: file.name },
    }),
  ).urls[0];

  const form = new FormData();
  form.append("url", signed.url);
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch("/api/upload", { method: "POST", body: form });
  } catch {
    throw new ApiError(0, "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, body?.message ?? "이미지를 업로드하지 못했습니다.", null, body);
  }
  return { filePath: signed.filePath, preview: imagePreviewUrl(signed.filePath) };
}
