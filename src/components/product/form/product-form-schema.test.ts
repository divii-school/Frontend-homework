import { describe, expect, it } from 'vitest';
import { imageKeyFromUrl, productFormSchema, stepOfField, toSaveRequest, type ProductFormValues } from './product-form-schema';

const valid: ProductFormValues = {
  productName: 'HW3-Pranesh-Test',
  productCode: 'PRD-020001',
  price: 1500,
  unitPrice: 700,
  description: '설명',
  images: [{ filePath: 'products/a.png', preview: 'https://x/products/a.png' }],
  isVisible: true,
  onSale: false,
  categoryId: 71,
  subCategoryId: 574,
  childCategoryId: 573,
  erpName: 'ERP',
  quantity: 2,
  taxType: 'tax_free',
  erpUnitPrice: 800,
};

const errorsOf = (values: Partial<Record<keyof ProductFormValues, unknown>>) => {
  const result = productFormSchema.safeParse({ ...valid, ...values });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('product form rules', () => {
  it('accepts a complete product', () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it('API rule: 단가 must be smaller than 판매가 (equal is refused)', () => {
    expect(errorsOf({ unitPrice: 1500 }).unitPrice).toBe('단가는 판매가보다 작아야 합니다.');
    expect(errorsOf({ unitPrice: 2000 }).unitPrice).toBeDefined();
  });

  it('the price rule fires on step 1 even while later steps are still empty (found by e2e)', () => {
    const onlyStep1 = { productName: 'x', productCode: 'PRD-1', price: 2000, unitPrice: 2000, description: 'd' };
    const result = productFormSchema.safeParse(onlyStep1);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'unitPrice' && i.message === '단가는 판매가보다 작아야 합니다.')).toBe(true);
  });

  it('design rules: name required, not blank, ≤ 100 characters', () => {
    expect(errorsOf({ productName: '   ' }).productName).toBe('상품명을 입력해 주세요.');
    expect(errorsOf({ productName: 'a'.repeat(101) }).productName).toContain('100자');
    expect(errorsOf({ productName: 'a'.repeat(100) }).productName).toBeUndefined();
  });

  it('amounts are whole numbers greater than 0', () => {
    expect(errorsOf({ price: 0 }).price).toContain('0보다');
    expect(errorsOf({ quantity: 1.5 }).quantity).toContain('정수');
    expect(errorsOf({ erpUnitPrice: undefined }).erpUnitPrice).toBeDefined();
  });

  it('at least one and at most four images', () => {
    expect(errorsOf({ images: [] }).images).toBe('대표 이미지를 1장 이상 등록해 주세요.');
    const five = Array.from({ length: 5 }, (_, i) => ({ filePath: `p/${i}`, preview: `u/${i}` }));
    expect(errorsOf({ images: five }).images).toContain('최대 4장');
  });

  it('all three category levels are required', () => {
    expect(errorsOf({ childCategoryId: undefined }).childCategoryId).toBe('소분류를 선택해 주세요.');
  });
});

describe('mapping to the API', () => {
  it('sends yes/no strings and image keys', () => {
    const body = toSaveRequest(valid);
    expect(body.isVisible).toBe('yes');
    expect(body.onSale).toBe('no');
    expect(body.isOptions).toBe('no');
    expect(body.images).toEqual(['products/a.png']);
  });

  it('turns a details URL back into the S3 key the API stores', () => {
    expect(imageKeyFromUrl('https://talking-club-dev.s3.ap-northeast-2.amazonaws.com/products/1/HW3-a.png')).toBe('products/1/HW3-a.png');
    expect(imageKeyFromUrl('products/img_1.jpg')).toBe('products/img_1.jpg');
  });

  it('knows which step owns a field (API error → open that step)', () => {
    expect(stepOfField('unitPrice')).toBe(0);
    expect(stepOfField('images')).toBe(1);
    expect(stepOfField('childCategoryId')).toBe(2);
    expect(stepOfField('erpName')).toBe(3);
  });
});
