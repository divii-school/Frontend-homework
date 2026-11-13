/** One level of the product category tree (category → sub category → child category). */
interface CategoryNodeBase {
  id: number;
  name: string;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

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

/** The three tree levels. Each level has its own add/edit/delete endpoints. */
export type CategoryLevel = 'category' | 'subCategory' | 'childCategory';

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
