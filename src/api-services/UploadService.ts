import { UPLOAD_TIMEOUT_MS } from "@/constants/api";
import { ROUTES } from "@/constants/routes";
import type { ApiEnvelope } from "@/types/api";
import type { ProductImage } from "@/types/product";
import { appClient } from "@/utils/api-client";

export const UploadService = {
  /**
   * Send one image to this app's own upload route (src/app/api/upload/route.ts), which stores it and answers
   * with the storage key and the public address. The browser does not talk to the storage server itself:
   * the bucket refuses uploads from sites that are not on its list, and a Vercel address is not.
   */
  async uploadImage(file: File): Promise<ProductImage> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await appClient.post<ApiEnvelope<ProductImage>>(ROUTES.uploadApi, form, { timeout: UPLOAD_TIMEOUT_MS });
    return data.data;
  },
};
