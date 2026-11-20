import type { ProductFormValues } from './types';

export type FormErrors = Partial<Record<keyof ProductFormValues, string>>;
export const STEP_LABELS = ['기본 정보', '이미지 · 노출', '카테고리 · ERP'];

const NAME_MAX = 100;

/** Korean object/topic particle depending on the last syllable's final consonant. */
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
  return word + (has ? withBatchim : without);
}

function money(v: number | null, label: string): string | undefined {
  if (v === null || v === undefined) return `${josa(label, '을', '를')} 입력해 주세요.`;
  if (v < 0) return `${josa(label, '은', '는')} 0원 이상이어야 합니다.`;
  return undefined;
}

/** Per-step validation, matching the API's required fields (addProductDto). */
export function validateStep(step: number, v: ProductFormValues, mode: 'create' | 'edit'): FormErrors {
  const e: FormErrors = {};
  if (step === 0) {
    if (!v.productName.trim()) e.productName = '상품명을 입력해 주세요.';
    else if (v.productName.trim().length > NAME_MAX) e.productName = `상품명은 ${NAME_MAX}자 이내로 입력해 주세요.`;
    if (mode === 'create' && !v.productCode.trim()) e.productCode = '상품코드를 생성해 주세요.';
    const up = money(v.unitPrice, '단가');
    if (up) e.unitPrice = up;
    const p = money(v.price, '판매가');
    if (p) e.price = p;
    if (!v.description.trim()) e.description = '상세 설명을 입력해 주세요.';
  }
  if (step === 1) {
    if (v.images.length === 0) e.images = '이미지를 1개 이상 등록해 주세요.';
  }
  if (step === 2) {
    if (!v.categoryId) e.categoryId = '대분류를 선택해 주세요.';
    if (!v.subCategoryId) e.subCategoryId = '중분류를 선택해 주세요.';
    if (!v.childCategoryId) e.childCategoryId = '소분류를 선택해 주세요.';
    if (!v.erpName.trim()) e.erpName = 'ERP 상품명을 입력해 주세요.';
    if (v.quantity === null || v.quantity < 1) e.quantity = '수량은 1 이상 입력해 주세요.';
    if (!v.taxType) e.taxType = '과세 구분을 선택해 주세요.';
    const eu = money(v.erpUnitPrice, 'ERP 단가');
    if (eu) e.erpUnitPrice = eu;
  }
  return e;
}

export function validateAll(v: ProductFormValues, mode: 'create' | 'edit'): { step: number; errors: FormErrors } | null {
  for (let s = 0; s < STEP_LABELS.length; s += 1) {
    const errors = validateStep(s, v, mode);
    if (Object.keys(errors).length) return { step: s, errors };
  }
  return null;
}
