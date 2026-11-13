import { z } from 'zod';
import { IMAGE_UPLOAD } from '@/config/upload';
import { decodeEntities } from '@/lib/text';
import type { ProductDetails, ProductSaveRequest, UploadedImage } from '@/types/product';

/**
 * One schema for the whole multi-step form; each step validates only its own fields
 * (STEP_FIELDS) before moving on. Rules = API (addProductDto: all required) + design 8.1.1/8.1.2
 * (name ≤ 100, not blank; prices and quantity whole numbers > 0) + the API's business rule
 * unitPriceMustBeLessThanPrice (단가 < 판매가, equal is refused).
 */
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 2000;
export const ERP_NAME_MAX = 100;
/** Largest amount accepted (₩ 1,000,000,000,000 is the design's own example). */
export const AMOUNT_MAX = 1_000_000_000_000;

const amount = (label: string) =>
  z
    .number({ error: `${label}을(를) 입력해 주세요.` })
    .int(`${label}은(는) 정수로 입력해 주세요.`)
    .min(1, `${label}은(는) 0보다 커야 합니다.`)
    .max(AMOUNT_MAX, `${label}이(가) 너무 큽니다.`);

const categoryId = (label: string) => z.number({ error: `${label}를 선택해 주세요.` }).int().positive();

export const productFormSchema = z
  .object({
    // Step 1 — 기본 정보
    productName: z
      .string()
      .trim()
      .min(1, '상품명을 입력해 주세요.')
      .max(NAME_MAX, `상품명은 ${NAME_MAX}자 이하로 입력해 주세요.`),
    productCode: z.string().min(1, '상품코드를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'),
    price: amount('판매가'),
    unitPrice: amount('단가'),
    description: z
      .string()
      .trim()
      .min(1, '상세설명을 입력해 주세요.')
      .max(DESCRIPTION_MAX, `상세설명은 ${DESCRIPTION_MAX}자 이하로 입력해 주세요.`),
    // Step 2 — 이미지 · 노출
    images: z
      .array(z.object({ filePath: z.string(), preview: z.string() }))
      .min(1, '대표 이미지를 1장 이상 등록해 주세요.')
      .max(IMAGE_UPLOAD.maxCount, `이미지는 최대 ${IMAGE_UPLOAD.maxCount}장까지 등록할 수 있습니다.`),
    isVisible: z.boolean(),
    onSale: z.boolean(),
    // Step 3 — 카테고리
    categoryId: categoryId('대분류'),
    subCategoryId: categoryId('중분류'),
    childCategoryId: categoryId('소분류'),
    // Step 4 — ERP
    erpName: z
      .string()
      .trim()
      .min(1, 'ERP 상품명을 입력해 주세요.')
      .max(ERP_NAME_MAX, `ERP 상품명은 ${ERP_NAME_MAX}자 이하로 입력해 주세요.`),
    quantity: amount('수량'),
    taxType: z.enum(['tax', 'tax_free'], { error: '과세 구분을 선택해 주세요.' }),
    erpUnitPrice: amount('ERP 단가'),
  })
  .refine((v) => v.unitPrice < v.price, {
    path: ['unitPrice'],
    message: '단가는 판매가보다 작아야 합니다.',
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;

export const STEPS = [
  { key: 'basic', label: '기본 정보', fields: ['productName', 'productCode', 'price', 'unitPrice', 'description'] },
  { key: 'media', label: '이미지 · 노출', fields: ['images', 'isVisible', 'onSale'] },
  { key: 'category', label: '카테고리', fields: ['categoryId', 'subCategoryId', 'childCategoryId'] },
  { key: 'erp', label: 'ERP 정보', fields: ['erpName', 'quantity', 'taxType', 'erpUnitPrice'] },
] as const satisfies ReadonlyArray<{ key: string; label: string; fields: ReadonlyArray<keyof ProductFormValues> }>;

export type StepKey = (typeof STEPS)[number]['key'];

/** Which step owns a field — used to jump to the step an API error belongs to. */
export function stepOfField(field: string): number {
  const index = STEPS.findIndex((step) => (step.fields as readonly string[]).includes(field));
  return index === -1 ? 0 : index;
}

export const EMPTY_FORM: ProductFormInput = {
  productName: '',
  productCode: '',
  price: undefined as unknown as number,
  unitPrice: undefined as unknown as number,
  description: '',
  images: [],
  isVisible: true,
  onSale: true,
  categoryId: undefined as unknown as number,
  subCategoryId: undefined as unknown as number,
  childCategoryId: undefined as unknown as number,
  erpName: '',
  quantity: 1,
  taxType: 'tax',
  erpUnitPrice: undefined as unknown as number,
};

/** Details shows full S3 URLs; save expects keys ("products/x.jpg"). */
export function imageKeyFromUrl(value: string): string {
  if (!/^https?:\/\//.test(value)) return value;
  try {
    return decodeURIComponent(new URL(value).pathname.replace(/^\//, ''));
  } catch {
    return value;
  }
}

/** API details → form values (edit mode). */
export function toFormValues(p: ProductDetails): ProductFormInput {
  return {
    productName: decodeEntities(p.productName),
    productCode: p.productCode,
    price: p.price,
    unitPrice: p.unitPrice,
    description: p.description ?? '',
    images: p.images.map<UploadedImage>((url) => ({ filePath: imageKeyFromUrl(url), preview: url })),
    isVisible: p.isVisible,
    onSale: p.onSale,
    categoryId: p.category?.id as number,
    subCategoryId: p.subCategory?.id as number,
    childCategoryId: p.childCategory?.id as number,
    erpName: p.erpName ?? '',
    quantity: p.quantity,
    taxType: p.taxType === 'tax_free' ? 'tax_free' : 'tax',
    erpUnitPrice: p.erpUnitPrice,
  };
}

/** Form values → API body (yes/no strings, image keys). */
export function toSaveRequest(v: ProductFormValues): ProductSaveRequest {
  return {
    productName: v.productName,
    productCode: v.productCode,
    price: v.price,
    unitPrice: v.unitPrice,
    description: v.description,
    images: v.images.map((image) => image.filePath),
    isVisible: v.isVisible ? 'yes' : 'no',
    onSale: v.onSale ? 'yes' : 'no',
    isOptions: 'no',
    categoryId: v.categoryId,
    subCategoryId: v.subCategoryId,
    childCategoryId: v.childCategoryId,
    erpName: v.erpName,
    quantity: v.quantity,
    taxType: v.taxType,
    erpUnitPrice: v.erpUnitPrice,
  };
}
