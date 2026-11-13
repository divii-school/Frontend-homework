'use client';

import { useId, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ACCEPT_ATTRIBUTE, IMAGE_UPLOAD, checkImageFile, imageSizeNote } from '@/config/upload';
import { useUploadProductImage } from '@/hooks/api/product/use-products';
import { errorMessage } from '@/lib/api/error-messages';
import { formatBytes } from '@/lib/format';
import type { UploadedImage } from '@/types/product';
import styles from './product-form.module.scss';

interface Props {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  error?: string;
  describedById?: string;
}

/**
 * Product images (8.1.1 ⑦: up to 4, 800×800 recommended, X to remove).
 * Each file is checked here first (type, size, how many), then uploaded one by one through
 * /api/upload; the form keeps only S3 keys. A failed file does not affect the others.
 */
export function ImageUploader({ value, onChange, error, describedById }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProductImage();
  const [problems, setProblems] = useState<string[]>([]);
  const [sizeNotes, setSizeNotes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const room = IMAGE_UPLOAD.maxCount - value.length;

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ''; // the same file can be chosen again after removing it
    const messages: string[] = [];
    const notes: string[] = [];
    if (files.length > room) {
      messages.push(`이미지는 최대 ${IMAGE_UPLOAD.maxCount}장까지 등록할 수 있습니다. 앞의 ${room}장만 올립니다.`);
    }
    const accepted: File[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      const problem = checkImageFile(file);
      if (problem === 'type') messages.push(`${file.name}: JPG, PNG, WEBP 이미지만 등록할 수 있습니다.`);
      else if (problem === 'size') messages.push(`${file.name}: ${formatBytes(IMAGE_UPLOAD.maxBytes)} 이하 이미지만 등록할 수 있습니다.`);
      else {
        const size = await readPixelSize(file);
        if (!size) {
          messages.push(`${file.name}: 이미지 파일을 읽을 수 없습니다. 다른 파일을 선택해 주세요.`);
          continue;
        }
        const note = imageSizeNote(size);
        if (note) notes.push(`${file.name}: ${note}`);
        accepted.push(file);
      }
    }

    let next = value;
    setUploading(accepted.length);
    for (const file of accepted) {
      try {
        const uploaded = await upload.mutateAsync(file);
        next = [...next, uploaded];
        onChange(next);
      } catch (uploadError) {
        messages.push(`${file.name}: ${errorMessage(uploadError)}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    setProblems(messages);
    setSizeNotes(notes);
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className={styles['uploader']}>
      <ul className={styles['image-grid']} aria-label="등록된 이미지">
        {value.map((image, index) => (
          <li key={image.filePath} className={styles['image-item']}>
            <Image src={image.preview} alt={`상품 이미지 ${index + 1}${index === 0 ? ' (대표)' : ''}`} fill sizes="120px" className={styles['image-preview']} />
            {index === 0 && <span className={styles['image-badge']}>대표</span>}
            <button type="button" className={styles['image-remove']} onClick={() => remove(index)} aria-label={`상품 이미지 ${index + 1} 삭제`}>
              <i className="pi pi-times" aria-hidden />
            </button>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`uploading-${i}`} className={`${styles['image-item']} ${styles['is-uploading']}`} aria-busy="true">
            <i className="pi pi-spin pi-spinner" aria-hidden />
            <span className="sr-only">업로드 중</span>
          </li>
        ))}
      </ul>

      <div className={styles['uploader-actions']}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple
          className="sr-only"
          onChange={(e) => void onFiles(e)}
          disabled={room <= 0 || uploading > 0}
          aria-describedby={describedById}
        />
        <button
          type="button"
          className={styles['add-file']}
          onClick={() => inputRef.current?.click()}
          disabled={room <= 0 || uploading > 0}
        >
          <i className="pi pi-upload" aria-hidden /> 파일 추가
        </button>
        <p className={styles['field-help']} id={describedById}>
          권장 크기 800×800px(정사각형) · JPG/PNG/WEBP · {formatBytes(IMAGE_UPLOAD.maxBytes)} 이하 · 최대 {IMAGE_UPLOAD.maxCount}장 (
          {value.length}/{IMAGE_UPLOAD.maxCount}) · 첫 번째 이미지가 대표 이미지입니다.
        </p>
      </div>

      {error && (
        <p className={styles['field-error']} role="alert">
          {error}
        </p>
      )}
      {problems.length > 0 && (
        <ul className={styles['upload-problems']} role="alert">
          {problems.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {sizeNotes.length > 0 && (
        <ul className={styles['upload-notes']} role="status">
          {sizeNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Decodes the file to read its pixel size; null when it is not a readable image (e.g. a renamed file). */
async function readPixelSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}
