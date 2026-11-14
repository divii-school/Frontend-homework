import type { CategoryOption } from './product-category';

/** API stores yes/no flags as the strings "yes" / "no" on write, but returns booleans on read. */
export type YesNo = 'yes' | 'no';

/** Tax types seen in the QA data. */
export const TAX_TYPES = ['tax', 'tax_free'] as const;
export type TaxType = (typeof TAX_TYPES)[number];

/** One row of GET /products (the list). */
export interface ProductListItem {
  id: number;
  uuid: string;
  productName: string;
  productCode: string;
  price: number;
  description: string;
  /** List: S3 keys ("products/img_1.jpg"). Details: full URLs. */
  images: string[];
  /** Full URL of the first image, or null. */
  image: string | null;
  isVisible: boolean;
  onSale: boolean;
  isOptions: boolean;
  erpCode: string;
  erpName: string;
  erpUnitPrice: number;
  quantity: number;
  taxType: TaxType | string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
  category: CategoryOption | null;
  subCategory: CategoryOption | null;
  childCategory: CategoryOption | null;
}

/** GET /products/details/{id}: the list row plus its options. */
export interface ProductDetails extends Omit<ProductListItem, 'image'> {
  productOptions: unknown[];
}

/** GET /products search can target one of two fields. */
export const PRODUCT_SEARCH_TYPES = ['productName', 'categoryName'] as const;
export type ProductSearchType = (typeof PRODUCT_SEARCH_TYPES)[number];

export interface ProductListQuery {
  page: number;
  limit: number;
  type?: ProductSearchType;
  search?: string;
}

/** Body of POST /products/add and PUT /products/edit/{id} (addProductDto / editProductDto). */
export interface ProductSaveRequest {
  productName: string;
  /** Only sent on create; immutable after. */
  productCode?: string;
  price: number;
  description: string;
  erpName: string;
  erpUnitPrice: number;
  taxType: TaxType;
  quantity: number;
  unitPrice: number;
  categoryId: number;
  subCategoryId: number;
  childCategoryId: number;
  /** S3 keys returned by the upload step. */
  images: string[];
  isOptions: YesNo;
  isVisible: YesNo;
  onSale: YesNo;
}

/** Response of POST /utils/upload-file-urls, one entry per requested URL. */
export interface SignedUploadUrl {
  url: string;
  preview: string;
  filePath: string;
}

/** What our own /api/upload route returns to the form. */
export interface UploadedImage {
  filePath: string;
  preview: string;
}
