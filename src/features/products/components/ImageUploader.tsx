'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { errorText } from '@/components/common/QueryState';
import { uploadProductImage, validateImage } from '../uploadService';
import { MAX_IMAGES, type UploadedImage } from '../types';
import styles from './ImageUploader.module.scss';

export function ImageUploader({
  value,
  onChange,
  error,
}: {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string[]>([]);
  const [localError, setLocalError] = useState('');

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLocalError('');
    const room = MAX_IMAGES - value.length - uploading.length;
    const list = Array.from(files);
    if (list.length > room) {
      setLocalError(`이미지는 최대 ${MAX_IMAGES}개까지 등록할 수 있습니다.`);
      return;
    }
    for (const f of list) {
      const msg = validateImage(f);
      if (msg) {
        setLocalError(msg);
        return;
      }
    }
    let next = [...value];
    for (const f of list) {
      const preview = URL.createObjectURL(f);
      setUploading((u) => [...u, preview]);
      try {
        const key = await uploadProductImage(f);
        next = [...next, { key, previewUrl: preview }];
        onChange(next);
      } catch (err) {
        URL.revokeObjectURL(preview);
        setLocalError(errorText(err));
      } finally {
        setUploading((u) => u.filter((p) => p !== preview));
      }
    }
    if (input.current) input.current.value = '';
  };

  const remove = (key: string) => onChange(value.filter((i) => i.key !== key));
  const msg = localError || error;

  return (
    <div>
      <ul className={styles.grid} aria-label="등록된 이미지">
        {value.map((img, i) => (
          <li key={img.key} className={styles.item}>
            {img.previewUrl ? (
              <img src={img.previewUrl} alt={`상품 이미지 ${i + 1}`} className={styles.img} />
            ) : (
              <span className={styles.noPreview}>{img.key.split('/').pop()}</span>
            )}
            <Button
              type="button"
              icon="pi pi-times"
              rounded
              text
              className={styles.remove}
              aria-label={`상품 이미지 ${i + 1} 삭제`}
              onClick={() => remove(img.key)}
            />
          </li>
        ))}
        {uploading.map((p) => (
          <li key={p} className={styles.item} aria-busy="true">
            <img src={p} alt="" className={`${styles.img} ${styles.dim}`} />
            <ProgressSpinner className={styles.spin} style={{ width: 28, height: 28 }} />
          </li>
        ))}
      </ul>
      <div className={styles.row}>
        <input
          ref={input}
          id="product-images"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => void onFiles(e.target.files)}
          aria-describedby="product-images-help"
        />
        <Button
          type="button"
          label="파일 추가"
          outlined
          onClick={() => input.current?.click()}
          disabled={value.length + uploading.length >= MAX_IMAGES}
        />
        <small id="product-images-help" className="muted">
          권장 크기: 800x800px (정사각형) / 최대 {MAX_IMAGES}개 / PNG·JPG·WEBP, 4MB 이하
        </small>
      </div>
      {msg && (
        <small className="p-error" role="alert">
          {msg}
        </small>
      )}
    </div>
  );
}
