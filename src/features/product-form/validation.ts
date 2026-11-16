import type { ProductFormValues } from "@/types/productForm";

/** Field → message. Empty object = step is valid. */
export type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export const STEPS = [
  { key: "basic", label: "Basic information" },
  { key: "images", label: "Images" },
  { key: "display", label: "Display & category" },
  { key: "erp", label: "ERP" },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;
const ERP_TEXT_MAX = 50;
const MONEY_MAX = 100_000_000;
const QUANTITY_MAX = 1_000_000;

/** Whole number in range (commas allowed while typing). Returns a message or null. */
function wholeNumber(raw: string, label: string, max: number): string | null {
  const value = raw.replace(/,/g, "").trim();
  if (value === "") return `Please enter the ${label}.`;
  if (!/^\d+$/.test(value)) return `The ${label} must be a whole number (numbers only).`;
  if (Number(value) > max) return `The ${label} must be ${max.toLocaleString("en-US")} or less.`;
  return null;
}

function required(raw: string, label: string, max: number): string | null {
  const value = raw.trim();
  if (!value) return `Please enter the ${label}.`;
  if (value.length > max) return `The ${label} must be ${max} characters or fewer.`;
  return null;
}

function collect(entries: Array<[keyof ProductFormValues, string | null]>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, message] of entries) if (message) errors[field] = message;
  return errors;
}

/**
 * Validation per step, matching what POST /products/add requires (all of these fields are required there).
 * erpCode is not validated: the API assigns it ("Auto-assigned by the server; ignored if sent").
 */
export function validateStep(step: StepIndex, v: ProductFormValues): FieldErrors {
  switch (step) {
    case 0:
      return collect([
        ["productName", required(v.productName, "product name", NAME_MAX)],
        ["productCode", v.productCode ? null : "The product code could not be generated. Please reload the page."],
        ["unitPrice", wholeNumber(v.unitPrice, "unit price", MONEY_MAX)],
        ["price", wholeNumber(v.price, "selling price", MONEY_MAX)],
        ["description", required(v.description, "detailed description", DESCRIPTION_MAX)],
      ]);
    case 1:
      return collect([["images", v.images.length ? null : "Please add at least one image."]]);
    case 2:
      return collect([
        ["categoryId", v.categoryId ? null : "Please select a major category."],
        ["subCategoryId", v.subCategoryId ? null : "Please select a medium category."],
        ["childCategoryId", v.childCategoryId ? null : "Please select a minor category."],
      ]);
    case 3:
      return collect([
        ["erpName", required(v.erpName, "product ERP name", ERP_TEXT_MAX)],
        ["quantity", wholeNumber(v.quantity, "quantity", QUANTITY_MAX)],
        ["taxType", v.taxType ? null : "Please select the tax type."],
        ["erpUnitPrice", wholeNumber(v.erpUnitPrice, "ERP unit price", MONEY_MAX)],
      ]);
  }
}

/** First step with an error (used before the final submit), or null when every step is valid. */
export function firstInvalidStep(v: ProductFormValues): StepIndex | null {
  for (const step of [0, 1, 2, 3] as const) if (Object.keys(validateStep(step, v)).length) return step;
  return null;
}

export const LIMITS = { NAME_MAX, DESCRIPTION_MAX, ERP_TEXT_MAX };
