import type { ProductDetails } from "@/api-services/ProductService.types";
import type { FormMode, ProductFormValues, ProductImageValue, ProductOptionRow } from "./product-form.model";

// Draft of the product form in sessionStorage (this browser tab only):
//  - key per mode: "hw3-product-draft-create" / "hw3-product-draft-edit-<id>"
//  - saved (debounced) while the user types, restored on reload, removed after a successful save or Cancel
//  - an EDIT draft also stores which server copy it was started from (`baseVersion`). It is restored only
//    while the product on the server is still that copy; otherwise the draft is dropped (ProductForm),
//    so an old draft can never overwrite newer data
//  - every draft of the tab is also removed on Log out (clearAllDrafts); a 401 / expiry keeps them for the same user
//  - only plain values go in: images are { filePath, preview, name } of FINISHED uploads — a File that is
//    still uploading lives in the upload widget, never in the form values, so it is never stored.

export const DRAFT_SAVE_DELAY_MS = 500;
const DRAFT_PREFIX = "hw3-product-draft-";

export interface StoredDraft {
  savedAt: number;
  values: ProductFormValues;
  /** Edit drafts only: serverVersionOf(the product the draft was started from). */
  baseVersion?: string;
}

/**
 * "Version" of a loaded product. `updatedAt` changes whenever the product row is saved. The option rows
 * live in their own table and saving only them does not change `updatedAt`, so they are part of the version.
 */
export function serverVersionOf(product: ProductDetails): string {
  return JSON.stringify([product.updatedAt, product.productOptions]);
}

export function draftStorageKey(mode: FormMode, productId?: number): string {
  return mode === "create" ? `${DRAFT_PREFIX}create` : `${DRAFT_PREFIX}edit-${productId ?? 0}`;
}

function cleanImages(list: unknown): ProductImageValue[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is ProductImageValue => !!item && typeof item === "object" && typeof (item as ProductImageValue).filePath === "string")
    .map(({ filePath, preview, name }) => ({ filePath, preview: preview ?? "", name: name ?? filePath }));
}

function cleanOptions(list: unknown): ProductOptionRow[] {
  if (!Array.isArray(list)) return [];
  return list.filter((row): row is ProductOptionRow => !!row && typeof row === "object" && typeof (row as ProductOptionRow).optionId === "number");
}

export function saveDraft(key: string, values: ProductFormValues, baseVersion?: string): void {
  try {
    const draft: StoredDraft = { savedAt: Date.now(), baseVersion, values: { ...values, images: cleanImages(values.images) } };
    window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage full / blocked (private mode): the form still works, just without a draft
  }
}

/** The stored draft merged over `base` (so a field added later still has a value), or null. */
export function readDraft(key: string, base: ProductFormValues): StoredDraft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft> | null;
    if (!parsed || typeof parsed !== "object" || !parsed.values || typeof parsed.values !== "object") return null;
    const values: ProductFormValues = {
      ...base,
      ...parsed.values,
      images: cleanImages(parsed.values.images),
      options: cleanOptions(parsed.values.options),
    };
    const baseVersion = typeof parsed.baseVersion === "string" ? parsed.baseVersion : undefined;
    return { savedAt: Number(parsed.savedAt) || Date.now(), values, baseVersion };
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Removes every product form draft of this tab (Log out / "Log in with another account"). */
export function clearAllDrafts(): void {
  try {
    const storage = window.sessionStorage;
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(DRAFT_PREFIX)) storage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
