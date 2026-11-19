"use client";

import { useMutation } from "@tanstack/react-query";
import UploadService, { type UploadedFile } from "@/api-services/UploadService";
import type { ApiError } from "@/types/api";
import { SHOWS_OWN_ERROR } from "@/utils/query-client";

/**
 * Uploads one image (signed URL, then this app's /api/upload route) and resolves { filePath, preview }.
 * Validate first with validateImageFile(file) from @/api-services/UploadService.
 */
export function useUploadImage(location?: string) {
  return useMutation<UploadedFile, ApiError, File>({
    mutationFn: (file) => UploadService.uploadFile(file, location),
    meta: SHOWS_OWN_ERROR, // the upload widget shows the error on the image tile (with Retry)
  });
}
