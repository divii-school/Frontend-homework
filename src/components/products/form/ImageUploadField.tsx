"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { validateImageFile } from "@/api-services/UploadService";
import { useUploadImage } from "@/hooks/API/upload/useUploadImage";
import { isApiError } from "@/types/api";
import { getApiMessage } from "@/utils/api-messages";
import { PRODUCT_RULES } from "@/utils/constants";
import type { ProductImageValue } from "./product-form.model";

interface ImageUploadFieldProps {
  id: string;
  value: ProductImageValue[];
  onChange: (images: ProductImageValue[]) => void;
  onBlur: () => void;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  /** Tells the form an upload is running (Next / Register wait for it). */
  onBusyChange: (busy: boolean) => void;
}

/** A file picked but not in the form yet: waiting, uploading, or failed (with Retry). */
interface PendingUpload {
  key: string;
  file: File;
  localUrl: string;
  status: "queued" | "uploading" | "failed";
  message?: string;
}

const { max: MAX_IMAGES, accept, acceptExtensions } = PRODUCT_RULES.images;
const ACCEPT_ATTR = [...accept, ...acceptExtensions.map((extension) => `.${extension}`)].join(",");

/** Message for a file that finds no free place (the form holds at most MAX_IMAGES images). */
const notAddedMessage = (fileName: string) => `"${fileName}" was not added: up to ${MAX_IMAGES} images can be registered.`;

// One thumbnail; a broken preview URL shows the grey placeholder instead of a broken image.
function Thumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="image-upload-placeholder" role="img" aria-label={alt}>
        <i className="pi pi-image" aria-hidden="true" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- S3 / blob URLs, sizes unknown (see next.config.ts)
  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}

// Image upload (design 8.1.1 #7 / 8.1.2 #6), up to 4 images:
//  1. the picked files are checked first (type JPG/PNG/GIF/WEBP, size limit, free slots) — a rejected
//     file gets its own message and is never uploaded
//  2. each accepted file is uploaded in order: POST /utils/upload-file-urls → signed S3 URL →
//     POST /api/upload (the server PUTs the file to S3) → { filePath, preview } (useUploadImage / UploadService)
//  3. only then the image joins the form value; failed uploads stay here with Retry / Remove
//  Removing an image needs no confirm: an "Undo" puts it back at the same place.
//  The limit of 4 is checked wherever an image can join the list: Add file, Undo, Retry, and when an
//  upload finishes (stopWhenFull). The form rule in StepImagesStatus is the last guard before saving.
export default function ImageUploadField({ id, value, onChange, onBlur, onBusyChange, ...aria }: ImageUploadFieldProps) {
  const upload = useUploadImage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [removed, setRemoved] = useState<{ image: ProductImageValue; index: number } | null>(null);

  // Uploads finish later than the render that started them → always add to the LATEST list
  const latestValue = useRef(value);
  latestValue.current = value;

  const uploadingCount = pending.filter((item) => item.status !== "failed").length;
  useEffect(() => onBusyChange(uploadingCount > 0), [uploadingCount, onBusyChange]);

  // Free the local preview URLs when the page closes
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => () => pendingRef.current.forEach((item) => URL.revokeObjectURL(item.localUrl)), []);

  // After a remove, focus the Undo button so the keyboard user can undo right away
  useEffect(() => {
    if (removed) document.getElementById(`${id}-undo`)?.focus();
  }, [removed, id]);

  const patchPending = (key: string, patch: Partial<PendingUpload>) =>
    setPending((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  // A waiting or failed upload must never become image no. 5. Known way to get there before this check:
  // 3 images + 1 failed upload → remove an image → add a file → Undo → Retry on the failed upload.
  // When the list is full the upload is marked as failed with the limit message; true = the caller stops.
  const stopWhenFull = (item: PendingUpload): boolean => {
    if (latestValue.current.length < MAX_IMAGES) return false;
    patchPending(item.key, { status: "failed", message: notAddedMessage(item.file.name) });
    return true;
  };

  const uploadOne = async (item: PendingUpload) => {
    if (stopWhenFull(item)) return; // before the upload: no request for a file that has no place
    patchPending(item.key, { status: "uploading", message: undefined });
    try {
      const result = await upload.mutateAsync(item.file);
      if (stopWhenFull(item)) return; // and again: the list can fill up while this file is uploading
      const next = [...latestValue.current, { filePath: result.filePath, preview: result.preview, name: item.file.name }];
      latestValue.current = next;
      onChange(next);
      setPending((list) => list.filter((entry) => entry.key !== item.key));
      URL.revokeObjectURL(item.localUrl);
    } catch (error) {
      patchPending(item.key, { status: "failed", message: isApiError(error) ? error.message : getApiMessage("uploadFailed") });
    }
  };

  const handleFiles = async (files: FileList | null) => {
    const picked = Array.from(files ?? []);
    if (fileInput.current) fileInput.current.value = ""; // the same file can be picked again
    if (picked.length === 0) return;
    onBlur();

    const messages: string[] = [];
    const accepted: PendingUpload[] = [];
    let freeSlots = MAX_IMAGES - latestValue.current.length - pending.length;
    picked.forEach((file) => {
      const problem = validateImageFile(file);
      if (problem) {
        messages.push(problem);
      } else if (freeSlots <= 0) {
        messages.push(notAddedMessage(file.name));
      } else {
        freeSlots -= 1;
        accepted.push({ key: `${Date.now()}-${file.name}-${accepted.length}`, file, localUrl: URL.createObjectURL(file), status: "queued" });
      }
    });
    setRejected(messages);
    if (accepted.length === 0) return;

    setPending((list) => [...list, ...accepted]);
    for (const item of accepted) {
      await uploadOne(item);
    }
  };

  const removeImage = (index: number) => {
    const image = value[index];
    if (!image) return;
    onChange(value.filter((_, position) => position !== index));
    setRemoved({ image, index });
  };

  const undoRemove = () => {
    if (!removed) return;
    if (value.length + uploadingCount >= MAX_IMAGES) {
      setRejected([`"${removed.image.name}" cannot come back: ${MAX_IMAGES} images are already registered.`]);
      setRemoved(null);
      return;
    }
    const next = [...value];
    next.splice(Math.min(removed.index, next.length), 0, removed.image);
    onChange(next);
    setRemoved(null);
  };

  const discardPending = (item: PendingUpload) => {
    URL.revokeObjectURL(item.localUrl);
    setPending((list) => list.filter((entry) => entry.key !== item.key));
  };

  const full = value.length + pending.length >= MAX_IMAGES;

  return (
    <div className="image-upload">
      {/* Thumbnails: uploaded images (first = main image), then the ones still uploading / failed */}
      {(value.length > 0 || pending.length > 0) && (
        <ul className="image-upload-list" aria-label="Product images">
          {value.map((image, index) => (
            <li key={`${image.filePath}-${index}`} className="image-upload-item">
              <div className="image-upload-thumb">
                <Thumb src={image.preview} alt={`Image ${index + 1}: ${image.name}`} />
                {index === 0 && <span className="image-upload-badge">Main</span>}
              </div>
              <div className="image-upload-meta">
                <span className="image-upload-name" title={image.name}>
                  {image.name}
                </span>
                <Button
                  type="button"
                  icon="pi pi-trash"
                  text
                  severity="danger"
                  className="image-upload-remove"
                  aria-label={`Remove image ${index + 1}: ${image.name}`}
                  onClick={() => removeImage(index)}
                />
              </div>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.key} className={`image-upload-item image-upload-item-${item.status}`}>
              <div className="image-upload-thumb">
                <Thumb src={item.localUrl} alt={`${item.file.name} (${item.status === "failed" ? "upload failed" : "uploading"})`} />
              </div>
              {item.status === "failed" ? (
                <div className="image-upload-meta image-upload-meta-failed">
                  <span className="field-error" role="alert">
                    {item.message}
                  </span>
                  <div className="image-upload-actions">
                    <Button type="button" label="Retry" text size="small" onClick={() => void uploadOne(item)} />
                    <Button type="button" label="Remove" text size="small" severity="secondary" onClick={() => discardPending(item)} />
                  </div>
                </div>
              ) : (
                <div className="image-upload-meta image-upload-meta-progress">
                  <ProgressBar mode="indeterminate" className="image-upload-progress" aria-label={`Uploading ${item.file.name}`} />
                  <span className="image-upload-status">{item.status === "queued" ? "Waiting…" : "Uploading…"}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add file button + hidden native file input (the button is the focus target for errors) */}
      <div className="image-upload-toolbar">
        <input
          ref={fileInput}
          id={`${id}-input`}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          hidden
          tabIndex={-1}
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          id={id}
          type="button"
          label="Add file"
          icon="pi pi-upload"
          outlined
          disabled={full}
          aria-invalid={aria["aria-invalid"]}
          aria-describedby={aria["aria-describedby"]}
          onClick={() => fileInput.current?.click()}
        />
        <span className="image-upload-count">
          {value.length} / {MAX_IMAGES} images
        </span>
      </div>

      {/* Live status for screen readers + the per-file rejection messages */}
      <p className="sr-only" role="status" aria-live="polite">
        {uploadingCount > 0 ? `${uploadingCount} image${uploadingCount > 1 ? "s" : ""} uploading` : ""}
      </p>
      {rejected.length > 0 && (
        <div className="image-upload-rejected" role="alert" aria-label="Files not added">
          <ul>
            {rejected.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {removed && (
        <div className="image-upload-undo" role="status">
          <span>
            Removed &quot;{removed.image.name}&quot;.
          </span>
          <Button id={`${id}-undo`} type="button" label="Undo" text size="small" onClick={undoRemove} />
          <Button
            type="button"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            aria-label="Dismiss"
            onClick={() => setRemoved(null)}
          />
        </div>
      )}
    </div>
  );
}
