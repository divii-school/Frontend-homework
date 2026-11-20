import type { ProductFormValues } from "@/types/productForm";

/** Field → message. Empty object = step is valid. */
export type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export const STEPS = [
  { key: "basic", label: "기본 정보" },
  { key: "images", label: "이미지" },
  { key: "display", label: "노출 · 카테고리" },
  { key: "erp", label: "ERP 정보" },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;
const ERP_TEXT_MAX = 50;
const MONEY_MAX = 100_000_000;
const QUANTITY_MAX = 1_000_000;

/** 을 / 를 after a Korean word (by its last syllable's final consonant). */
function obj(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}을(를)`;
  return (code - 0xac00) % 28 ? `${word}을` : `${word}를`;
}

/** 은 / 는 after a Korean word. */
function topic(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}은(는)`;
  return (code - 0xac00) % 28 ? `${word}은` : `${word}는`;
}

/** Whole number in range (commas allowed while typing). Returns a message or null. */
function wholeNumber(raw: string, label: string, max: number): string | null {
  const value = raw.replace(/,/g, "").trim();
  if (value === "") return `${obj(label)} 입력해 주세요.`;
  if (!/^\d+$/.test(value)) return `${topic(label)} 숫자만 입력해 주세요.`;
  if (Number(value) > max) return `${topic(label)} ${max.toLocaleString("ko-KR")} 이하로 입력해 주세요.`;
  return null;
}

function required(raw: string, label: string, max: number): string | null {
  const value = raw.trim();
  if (!value) return `${obj(label)} 입력해 주세요.`;
  if (value.length > max) return `${topic(label)} ${max}자 이내로 입력해 주세요.`;
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
        ["productName", required(v.productName, "상품명", NAME_MAX)],
        ["productCode", v.productCode ? null : "상품 코드를 만들지 못했습니다. 페이지를 새로 고쳐 주세요."],
        ["unitPrice", wholeNumber(v.unitPrice, "단가", MONEY_MAX)],
        ["price", wholeNumber(v.price, "판매가", MONEY_MAX)],
        ["description", required(v.description, "상세설명", DESCRIPTION_MAX)],
      ]);
    case 1:
      return collect([["images", v.images.length ? null : "이미지를 1장 이상 등록해 주세요."]]);
    case 2:
      return collect([
        ["categoryId", v.categoryId ? null : "대분류를 선택해 주세요."],
        ["subCategoryId", v.subCategoryId ? null : "중분류를 선택해 주세요."],
        ["childCategoryId", v.childCategoryId ? null : "소분류를 선택해 주세요."],
      ]);
    case 3:
      return collect([
        ["erpName", required(v.erpName, "상품ERP명", ERP_TEXT_MAX)],
        ["quantity", wholeNumber(v.quantity, "갯수", QUANTITY_MAX)],
        ["taxType", v.taxType ? null : "비과세를 선택해 주세요."],
        ["erpUnitPrice", wholeNumber(v.erpUnitPrice, "ERP 단가", MONEY_MAX)],
      ]);
  }
}

/** First step with an error (used before the final submit), or null when every step is valid. */
export function firstInvalidStep(v: ProductFormValues): StepIndex | null {
  for (const step of [0, 1, 2, 3] as const) if (Object.keys(validateStep(step, v)).length) return step;
  return null;
}

export const LIMITS = { NAME_MAX, DESCRIPTION_MAX, ERP_TEXT_MAX };
