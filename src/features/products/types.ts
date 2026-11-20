export type YesNo = 'yes' | 'no';
export type SearchType = 'productName' | 'categoryName';

export interface ProductListItem {
  id: number;
  name: string;
  code: string;
  thumbnail?: string;
  price?: number;
  categoryPath: string;
  isVisible: YesNo;
  onSale: YesNo;
  createdAt?: string;
}

export interface ProductDetail {
  id: number;
  productName: string;
  productCode: string;
  erpCode?: string;
  price: number;
  unitPrice: number;
  description: string;
  images: string[];
  isVisible: YesNo;
  onSale: YesNo;
  categoryId?: number;
  subCategoryId?: number;
  childCategoryId?: number;
  categoryPath: string;
  erpName: string;
  erpUnitPrice: number;
  quantity: number;
  taxType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadedImage {
  /** S3 key sent to the API, e.g. products/abc.png */
  key: string;
  /** URL used for the preview only */
  previewUrl: string;
}

/** Form state shared by every step of the multi-step form. */
export interface ProductFormValues {
  productName: string;
  productCode: string;
  unitPrice: number | null;
  price: number | null;
  description: string;
  images: UploadedImage[];
  isVisible: YesNo;
  onSale: YesNo;
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  erpName: string;
  erpUnitPrice: number | null;
  quantity: number | null;
  taxType: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  productName: '',
  productCode: '',
  unitPrice: null,
  price: null,
  description: '',
  images: [],
  isVisible: 'yes',
  onSale: 'yes',
  categoryId: null,
  subCategoryId: null,
  childCategoryId: null,
  erpName: '',
  erpUnitPrice: null,
  quantity: null,
  taxType: '',
};

export interface Option {
  id: number;
  name: string;
}

export const TAX_TYPES = [
  { label: '과세', value: 'tax' },
  { label: '비과세', value: 'tax_free' },
];

export function taxLabel(v: string): string {
  return TAX_TYPES.find((t) => t.value === v)?.label ?? (v || '-');
}
export const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];
export const MAX_IMAGES = 4;
/** 4MB: uploads pass through our /api/upload route and Vercel caps request bodies at 4.5MB. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
