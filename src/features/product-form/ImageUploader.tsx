"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { uploadProductImage } from "@/services/uploads";
import { errorMessage } from "@/lib/errors";
import { PRODUCT_IMAGE_MAX, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES, type ProductImage } from "@/types/productForm";
import styles from "./ProductForm.module.scss";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
}

const MB = PRODUCT_IMAGE_MAX_BYTES / 1024 / 1024;

/** Client-side check before anything is uploaded. Returns a message or null. */
export function checkImageFile(file: File): string | null {
  if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) return `“${file.name}”: JPG, PNG, WebP 이미지만 올릴 수 있습니다.`;
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return `“${file.name}”: ${MB}MB 이하 이미지만 올릴 수 있습니다.`;
  return null;
}

/**
 * Figma 8.1.1 #7: up to 4 images, 800×800 recommended, × to remove.
 * Files are checked (type, size), uploaded right away and shown from the stored copy, so going
 * back and forth between steps or a failed save never loses them.
 */
export function ImageUploader({ images, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [uploading, setUploading] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const slotsLeft = PRODUCT_IMAGE_MAX - images.length - uploading;

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const messages: string[] = [];
    const accepted: File[] = [];
    for (const file of files) {
      const problem = checkImageFile(file);
      if (problem) messages.push(problem);
      else if (accepted.length < slotsLeft) accepted.push(file);
      else messages.push(`이미지는 최대 ${PRODUCT_IMAGE_MAX}장까지 등록할 수 있어 “${file.name}” 파일은 제외했습니다.`);
    }
    setProblems(messages);
    if (inputRef.current) inputRef.current.value = "";
    if (!accepted.length) return;

    setUploading((n) => n + accepted.length);
    const results = await Promise.allSettled(accepted.map((file) => uploadProductImage(file)));
    setUploading((n) => n - accepted.length);
    const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.flatMap((r, i) => (r.status === "rejected" ? [`“${accepted[i].name}”: ${errorMessage(r.reason)}`] : []));
    if (failed.length) setProblems((prev) => [...prev, ...failed]);
    if (uploaded.length) onChange([...images, ...uploaded].slice(0, PRODUCT_IMAGE_MAX));
  }

  return (
    <div className={styles.images}>
      <ul className={styles["image-grid"]} aria-label="상품 이미지">
        {images.map((image, index) => (
          <li key={image.filePath} className={styles["image-tile"]}>
            <Image src={image.preview} alt={`상품 이미지 ${index + 1}`} fill sizes="140px" className={styles["image-img"]} />
            {index === 0 && <span className={styles["main-badge"]}>썸네일</span>}
            <button
              type="button"
              className={styles["remove-image"]}
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              aria-label={`이미지 ${index + 1} 삭제`}
            >
              ×
            </button>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className={`${styles["image-tile"]} ${styles["image-uploading"]}`} role="status">
            업로드 중…
          </li>
        ))}
      </ul>

      <div className={styles["image-actions"]}>
        <input
          ref={inputRef}
          type="file"
          accept={PRODUCT_IMAGE_TYPES.join(",")}
          multiple
          className="visually-hidden"
          onChange={(e) => addFiles(e.target.files)}
          aria-describedby={hintId}
          tabIndex={-1}
          aria-hidden
        />
        <button
          type="button"
          className={styles["add-file"]}
          onClick={() => inputRef.current?.click()}
          disabled={slotsLeft <= 0}
          aria-describedby={hintId}
        >
          파일추가
        </button>
        <p id={hintId} className={styles.hint}>
          권장 크기: 800×800px(정사각형) · JPG, PNG, WebP {MB}MB 이하 · 최대 {PRODUCT_IMAGE_MAX}장. 첫 번째 이미지가 썸네일로
          사용됩니다.
        </p>
      </div>

      {(problems.length > 0 || error) && (
        <div role="alert" className={styles.error}>
          {error && <p>{error}</p>}
          {problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
