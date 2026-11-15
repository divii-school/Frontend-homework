import axios from "axios";
import { IMAGE_RULES } from "@/constants/products";
import type { ApiEnvelope } from "@/types/api";
import type { ProductImage } from "@/types/product";
import { apiClient, toApiError } from "@/utils/api-client";
import { API_ENDPOINTS } from "@/utils/api-integration";

interface SignedUrl {
  /** Where the file is sent (PUT). Valid for a short time. */
  url: string;
  /** Public address of the file after the upload. */
  preview: string;
  /** Storage key that goes into the product's `images`. */
  filePath: string;
}

export const UploadService = {
  /**
   * Two steps: ask the API for a signed address, then send the file straight to storage.
   * The file never passes through our own server.
   */
  async uploadImage(file: File): Promise<ProductImage> {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const { data } = await apiClient.post<ApiEnvelope<{ urls: SignedUrl[] }>>(API_ENDPOINTS.upload.signedUrls, {
      location: IMAGE_RULES.uploadLocation,
      extension,
      count: 1,
      fileName: file.name,
    });
    const signed = data.data.urls[0];

    try {
      // A plain axios call: the storage server must not receive our API token or headers.
      await axios.put(signed.url, file, { headers: { "Content-Type": file.type } });
    } catch (error) {
      throw toApiError(error);
    }
    return { key: signed.filePath, previewUrl: signed.preview, name: file.name };
  },
};
