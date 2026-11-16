import type { CategoryOption } from "@/types/category";

export type TaxType = "tax" | "tax_free";

/** A product as GET /products and GET /products/details/{id} return it. */
export interface Product {
  id: number;
  productName: string;
  productCode: string;
  price: number;
  description: string;
  /** Details: full addresses. List: storage keys, with the first image's full address in `image`. */
  images: string[];
  image?: string | null;
  isVisible: boolean;
  onSale: boolean;
  erpCode: string | null;
  erpName: string;
  erpUnitPrice: number;
  quantity: number;
  taxType: TaxType;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
  category: CategoryOption | null;
  subCategory: CategoryOption | null;
  childCategory: CategoryOption | null;
}

export type YesNo = "yes" | "no";

/** Body of POST /products/add and PUT /products/edit/{id} (the API wants "yes"/"no" strings, not booleans). */
export interface ProductRequest {
  productName: string;
  productCode: string;
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
  images: string[];
  isVisible: YesNo;
  onSale: YesNo;
}

export type ProductSearchType = "productName" | "categoryName";
export type ProductSortField = "createdAt" | "productName" | "price";
export type SortOrder = "asc" | "desc";

/** Everything the product list keeps in the URL. */
export interface ProductListParams {
  page: number;
  limit: number;
  search: string;
  type: ProductSearchType;
  categoryId: number | null;
  sort: ProductSortField;
  order: SortOrder;
}

/** One picked image in the form: already on the server (`key`) or still uploading. */
export interface ProductImage {
  key: string;
  previewUrl: string;
  name: string;
}

/** The multi-step form keeps every field as the user typed it (strings), so nothing is lost between steps. */
export interface ProductFormValues {
  erpName: string;
  productName: string;
  productCode: string;
  taxType: TaxType;
  quantity: string;
  unitPrice: string;
  erpUnitPrice: string;
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  description: string;
  images: ProductImage[];
  isVisible: boolean;
  onSale: boolean;
  /** Edit mode: the price saved on the server, kept until 수량 or 단가 is changed. Null in create mode. */
  storedPrice: number | null;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;
