import type { YesNo } from "@/types/api";

// Products — talking-club-backend release/qa, src/modules/products/v1 (+ entities/product.entity.ts).

export type ProductType = "MAIN" | "SUPPLEMENTARY";
/** Which list endpoint the search box uses: product name (list A) or category name (list B). */
export type ProductSearchType = "productName" | "categoryName";
export type TaxType = "tax" | "tax_free";
export type ProductOptionsType = "SINGLE_VOLUME" | "CATEGORY_OPTION";

export interface CategoryRef {
  id: number;
  name: string;
}

/** A product row as both list endpoints return it. Server order is always id DESC. */
export interface Product {
  id: number;
  uuid: string;
  productName: string;
  productCode: string;
  /** 판매가 (selling price): what the shopping cart and the order charge per item (backend `sellingPrice: product.price`). */
  price: number;
  /** 단가 (unit price): must be lower than `price` (API rule unitPriceMustBeLessThanPrice). */
  unitPrice: number;
  description: string;
  /** S3 keys in the lists (e.g. "products/abc.png"). */
  images: string[];
  /** Full URL of the first image, or null → grey placeholder. */
  image: string | null;
  isVisible: boolean;
  onSale: boolean;
  /** true = MAIN product (has options), false = SUPPLEMENTARY. */
  isOptions: boolean;
  erpCode: string;
  erpName: string;
  erpUnitPrice: number;
  quantity: number;
  taxType: TaxType | string;
  category: CategoryRef | null;
  subCategory: CategoryRef | null;
  childCategory: CategoryRef | null;
  createdBy: number | null;
  isSuspended: boolean;
  isDeleted: boolean;
  /** ISO date — show with formatDateTime(). */
  createdAt: string;
  updatedAt: string;
}

export interface ProductOptionValue {
  optionId: number;
  optionName: string;
  optionCode: string;
  price: number;
}

export interface ProductOptionSet {
  optionGroup: number;
  type: ProductOptionsType;
  option: ProductOptionValue[];
}

/** GET /products/details/:id — images are full URLs here, options grouped by optionGroup + type. */
export interface ProductDetails extends Omit<Product, "image"> {
  productOptions: ProductOptionSet[];
}

/** List A — GET /products/get-products-by-category. */
export interface ProductsByCategoryParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  subCategoryId?: number;
  childCategoryId?: number;
  productType?: ProductType;
}

/** List B — GET /products?type=categoryName&search= (search by category name at any level). */
export interface ProductsByCategoryNameParams {
  page: number;
  limit: number;
  search?: string;
}

/** What the list screen keeps in the URL; useGetProductList picks list A or B from `searchType`. */
export interface ProductListQuery extends ProductsByCategoryParams {
  searchType: ProductSearchType;
}

export interface ProductOptionInput {
  optionId: number;
  price: number;
}

export interface ProductSetInput {
  optionGroup: number;
  type: ProductOptionsType;
  option: ProductOptionInput[];
}

/** Body shared by add and edit. */
export interface ProductFormPayload {
  productName: string;
  price: number;
  unitPrice: number;
  description: string;
  erpName: string;
  erpUnitPrice: number;
  taxType: TaxType;
  quantity: number;
  categoryId: number;
  subCategoryId: number;
  childCategoryId: number;
  /** S3 keys (UploadService → filePath), 1..4. */
  images: string[];
  isVisible: YesNo;
  onSale: YesNo;
  isOptions: YesNo;
  productSets?: ProductSetInput[];
}

/** POST /products/add — productCode only on create (GET /products/generate-code). */
export interface AddProductPayload extends ProductFormPayload {
  productCode: string;
}

export type EditProductPayload = ProductFormPayload;

export interface EditProductInput {
  id: number;
  payload: EditProductPayload;
}

export interface UpdateProductStatusInput {
  id: number;
  isVisible: boolean;
}

/** Category pickers for the product form (GET /products/categories, /subcategories/:id, /childcategories/:id). */
export interface CategoryOption {
  id: number;
  name: string;
  sortOrder?: number;
}
