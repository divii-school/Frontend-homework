"use client";

import Image from "next/image";
import { Button } from "primereact/button";
import { useRef, useState, type ChangeEvent } from "react";
import { PREVIEW_SIZE } from "@/constants/design";
import { IMAGE_RULES } from "@/constants/products";
import { useUploadProductImage } from "@/hooks/API/products/useProductMutations";
import type { ProductImage } from "@/types/product";
import { formatMegabytes } from "@/utils/format";
import { imageFileError } from "@/utils/product-rules";

interface ImageUploaderProps {
  images: ProductImage[];
  /** The form's validation message for this field ("at least one image"). */
  error?: string;
  onChange: (images: ProductImage[]) => void;
}

/**
 * Product images. For each picked file: check type and size here (no request for a bad file) -> upload ->
 * add the stored image to the form. The form only ever holds images that are already on the server,
 * so "save" never has to wait for an upload. Removing takes the image out of the form; the product is
 * changed only when the form is saved.
 */
export function ImageUploader({ images, error, onChange }: ImageUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadProductImage();
  const [fileError, setFileError] = useState<string | null>(null);

  const handlePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clear the input so picking the same file again fires onChange again.
    event.target.value = "";
    setFileError(null);

    let current = images;
    for (const file of files) {
      const problem = imageFileError(file, current.length);
      if (problem) {
        setFileError(`${file.name}: ${problem}`);
        break;
      }
      try {
        current = [...current, await upload.mutateAsync(file)];
        onChange(current);
      } catch {
        // upload.error holds the API's message and is shown below; images already added stay.
        break;
      }
    }
  };

  const message = fileError ?? upload.error?.messages[0] ?? error;
  const full = images.length >= IMAGE_RULES.maxCount;

  return (
    <div className="image-uploader">
      <input
        ref={fileInput}
        id="product-images"
        className="visually-hidden"
        type="file"
        accept={IMAGE_RULES.accept}
        multiple
        tabIndex={-1}
        onChange={handlePick}
      />
      <div className="image-uploader-row">
        <Button
          type="button"
          label="파일추가"
          icon="pi pi-plus"
          outlined
          loading={upload.isPending}
          disabled={upload.isPending || full}
          aria-describedby="product-images-hint"
          onClick={() => fileInput.current?.click()}
        />
        <p className="form-field-hint" id="product-images-hint">
          권장 사이즈: 800x800px (정사각형) / PNG, JPG, WEBP / 장당 {formatMegabytes(IMAGE_RULES.maxBytes)} 이하 / 최대{" "}
          {IMAGE_RULES.maxCount}장 ({images.length}/{IMAGE_RULES.maxCount})
        </p>
      </div>
      {message && (
        <p className="form-field-error" role="alert">
          {message}
        </p>
      )}
      {images.length > 0 && (
        <ul className="image-uploader-list">
          {images.map((image) => (
            <li className="image-uploader-item" key={image.key}>
              <Image src={image.previewUrl} alt={image.name} width={PREVIEW_SIZE} height={PREVIEW_SIZE} />
              <Button
                type="button"
                className="image-uploader-remove"
                icon="pi pi-times"
                rounded
                severity="danger"
                aria-label={`${image.name} 삭제`}
                onClick={() => onChange(images.filter((item) => item.key !== image.key))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
