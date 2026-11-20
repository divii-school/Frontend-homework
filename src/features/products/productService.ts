import { api } from '@/lib/api/client';
import { isObject, pickArray, pickNumber, pickString, toPaged, unwrapData, type Paged } from '@/lib/api/normalize';
import type { Option, ProductDetail, ProductFormValues, ProductListItem, SearchType, YesNo } from './types';

const IMAGE_BASE = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? '').replace(/\/$/, '');

export function imageUrl(keyOrUrl: string | undefined): string | undefined {
  if (!keyOrUrl) return undefined;
  if (/^(https?:|blob:|data:)/.test(keyOrUrl)) return keyOrUrl;
  return IMAGE_BASE ? `${IMAGE_BASE}/${keyOrUrl.replace(/^\//, '')}` : undefined;
}

function yesNo(v: unknown): YesNo {
  if (v === true || v === 1) return 'yes';
  if (typeof v === 'string' && ['yes', 'y', 'true', '1', 'active'].includes(v.toLowerCase())) return 'yes';
  return 'no';
}

function nameOf(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  return pickString(v, ['name', 'categoryName']);
}

function categoryPath(raw: unknown): string {
  if (!isObject(raw)) return '-';
  const flat = pickString(raw, ['categoryPath', 'categoryName']);
  const parts = [
    nameOf(raw.category) ?? flat,
    nameOf(raw.subCategory) ?? pickString(raw, ['subCategoryName']),
    nameOf(raw.childCategory) ?? pickString(raw, ['childCategoryName']),
  ].filter(Boolean);
  return parts.length ? parts.join(' > ') : '-';
}

function firstImage(raw: unknown): string | undefined {
  const imgs = pickArray(raw, ['images', 'productImages']);
  const first = imgs[0];
  return typeof first === 'string' ? first : pickString(first, ['url', 'image', 'path', 'key']) ?? pickString(raw, ['thumbnail', 'image']);
}

export function mapListItem(raw: unknown): ProductListItem {
  return {
    id: pickNumber(raw, ['id', 'productId']) ?? 0,
    name: pickString(raw, ['productName', 'name']) ?? '-',
    code: pickString(raw, ['productCode', 'code', 'erpCode']) ?? '',
    thumbnail: firstImage(raw),
    price: pickNumber(raw, ['price', 'sellingPrice']),
    categoryPath: categoryPath(raw),
    isVisible: yesNo(isObject(raw) ? raw.isVisible ?? raw.status : undefined),
    onSale: yesNo(isObject(raw) ? raw.onSale : undefined),
    createdAt: pickString(raw, ['createdAt', 'created_at', 'registrationDate']),
  };
}

export function mapDetail(body: unknown): ProductDetail {
  let d = unwrapData(body);
  if (isObject(d) && isObject(d.product)) d = d.product;
  const images = pickArray(d, ['images', 'productImages'])
    .map((i) => (typeof i === 'string' ? i : pickString(i, ['url', 'image', 'path', 'key'])))
    .filter((v): v is string => !!v);
  const cat = isObject(d) ? d : {};
  return {
    id: pickNumber(d, ['id', 'productId']) ?? 0,
    productName: pickString(d, ['productName', 'name']) ?? '',
    productCode: pickString(d, ['productCode', 'code']) ?? '',
    erpCode: pickString(d, ['erpCode']),
    price: pickNumber(d, ['price']) ?? 0,
    unitPrice: pickNumber(d, ['unitPrice']) ?? 0,
    description: pickString(d, ['description']) ?? '',
    images,
    isVisible: yesNo(cat.isVisible),
    onSale: yesNo(cat.onSale),
    categoryId: pickNumber(d, ['categoryId']) ?? pickNumber(cat.category, ['id']),
    subCategoryId: pickNumber(d, ['subCategoryId']) ?? pickNumber(cat.subCategory, ['id']),
    childCategoryId: pickNumber(d, ['childCategoryId']) ?? pickNumber(cat.childCategory, ['id']),
    categoryPath: categoryPath(d),
    erpName: pickString(d, ['erpName']) ?? '',
    erpUnitPrice: pickNumber(d, ['erpUnitPrice']) ?? 0,
    quantity: pickNumber(d, ['quantity']) ?? 0,
    taxType: pickString(d, ['taxType']) ?? '',
    createdAt: pickString(d, ['createdAt', 'created_at']),
    updatedAt: pickString(d, ['updatedAt', 'updated_at']),
  };
}

function mapOptions(body: unknown): Option[] {
  let d = unwrapData(body);
  if (!Array.isArray(d)) d = pickArray(d, ['data', 'list', 'items', 'categories', 'subCategories', 'childCategories']);
  return (d as unknown[]).map((r) => ({
    id: pickNumber(r, ['id', 'categoryId', 'subCategoryId', 'childCategoryId']) ?? 0,
    name: pickString(r, ['name', 'categoryName', 'subCategoryName', 'childCategoryName']) ?? '-',
  }));
}

export function toDto(v: ProductFormValues, includeCode: boolean) {
  const dto = {
    productName: v.productName.trim(),
    price: v.price ?? 0,
    unitPrice: v.unitPrice ?? 0,
    description: v.description.trim(),
    images: v.images.map((i) => i.key),
    isVisible: v.isVisible,
    onSale: v.onSale,
    isOptions: 'no',
    categoryId: v.categoryId ?? 0,
    subCategoryId: v.subCategoryId ?? 0,
    childCategoryId: v.childCategoryId ?? 0,
    erpName: v.erpName.trim(),
    erpUnitPrice: v.erpUnitPrice ?? 0,
    quantity: v.quantity ?? 0,
    taxType: v.taxType,
  };
  return includeCode ? { ...dto, productCode: v.productCode.trim() } : dto;
}

export interface ProductListParams {
  page: number;
  limit: number;
  type: SearchType;
  search: string;
}

export const productService = {
  async list(p: ProductListParams, signal?: AbortSignal): Promise<Paged<ProductListItem>> {
    const body = await api.get(
      '/products',
      { page: p.page, limit: p.limit, type: p.search ? p.type : undefined, search: p.search || undefined },
      signal,
    );
    return toPaged(body, mapListItem, p.page, p.limit);
  },
  async detail(id: number): Promise<ProductDetail> {
    return mapDetail(await api.get(`/products/details/${id}`));
  },
  create(v: ProductFormValues) {
    return api.post('/products/add', toDto(v, true));
  },
  update(id: number, v: ProductFormValues) {
    return api.put(`/products/edit/${id}`, toDto(v, false));
  },
  removeMany(ids: number[]) {
    return api.delete('/products/delete', { ids: ids.map(String) });
  },
  updateStatus(id: number, status: YesNo) {
    return api.put(`/products/update-status/${id}/${status}`);
  },
  async generateCode(): Promise<string> {
    const d = unwrapData(await api.get('/products/generate-code'));
    return typeof d === 'string' ? d : pickString(d, ['productCode', 'code']) ?? '';
  },
  async categories(): Promise<Option[]> {
    return mapOptions(await api.get('/products/categories'));
  },
  async subcategories(id: number): Promise<Option[]> {
    return mapOptions(await api.get(`/products/subcategories/${id}`));
  },
  async childcategories(id: number): Promise<Option[]> {
    return mapOptions(await api.get(`/products/childcategories/${id}`));
  },
  async byCategory(categoryId: number, page: number, limit: number): Promise<Paged<ProductListItem>> {
    const body = await api.get('/products/get-products-by-category', { categoryId, page, limit });
    return toPaged(body, mapListItem, page, limit);
  },
};
