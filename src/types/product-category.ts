/** One level of the product category tree (category → sub category → child category). */
interface CategoryNodeBase {
  id: number;
  name: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One node as the per-level endpoints return it (no children inside). */
export type CategoryNode = CategoryNodeBase;

export type ProductChildCategory = CategoryNodeBase;

export interface ProductSubCategory extends CategoryNodeBase {
  childCategories: ProductChildCategory[];
}

export interface ProductCategory extends CategoryNodeBase {
  subCategories: ProductSubCategory[];
}

/** GET /product-category/list also returns these next to `data`. */
export interface ProductCategoryListExtras {
  totalRecords: number;
  isCreatable: boolean;
}

/** The three tree levels. Each level has its own add/edit/delete/reorder endpoints. */
export type CategoryLevel = 'category' | 'subCategory' | 'childCategory';

/** Korean name of each level (Figma 8.2.0: 대분류 / 중분류 / 소분류). */
export const LEVEL_LABEL: Record<CategoryLevel, string> = {
  category: '대분류',
  subCategory: '중분류',
  childCategory: '소분류',
};

/** The level below each level (소분류 has none: the tree is at most 3 deep). */
export const CHILD_LEVEL: Record<CategoryLevel, CategoryLevel | null> = {
  category: 'subCategory',
  subCategory: 'childCategory',
  childCategory: null,
};

/** Body for add/edit at each level (addEditCategoryDto / addEditSubCategoryDto / addEditChildCategoryDto). */
export type CategorySaveRequest =
  | { level: 'category'; name: string }
  | { level: 'subCategory'; name: string; categoryId: number }
  | { level: 'childCategory'; name: string; subCategoryId: number };

/** Flat option used by dropdowns (GET /products/categories, /subcategories/{id}, /childcategories/{id}). */
export interface CategoryOption {
  id: number;
  name: string;
}
