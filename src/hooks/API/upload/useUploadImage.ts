"use client";

import { useMutation } from "@tanstack/react-query";
import UploadService, { type UploadedFile } from "@/api-services/UploadService";
import type { ApiError } from "@/types/api";

/**
 * Uploads one image (signed URL + PUT) and resolves { filePath, preview }.
 * Validate first with validateImageFile(file) from @/api-services/UploadService.
 */
export function useUploadImage(location?: string) {
  return useMutation<UploadedFile, ApiError, File>({
    mutationFn: (file) => UploadService.uploadFile(file, location),
  });
}
