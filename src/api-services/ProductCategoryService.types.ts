// Product category tree — GET /product-category/list (talking-club-backend release/qa).
// Three levels: top (Category) → middle (SubCategory) → minor (ChildCategory).
// Only the top level is sorted by the server; the service sorts the two lower levels by sortOrder.

export interface ChildCategory {
  id: number;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  id: number;
  name: string;
  sortOrder: number;
  childCategories: ChildCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  subCategories: SubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

/** Tree + whether another top-level category may be added (server: max 3). */
export interface CategoryTree {
  categories: Category[];
  /** false when 3 top-level categories exist → disable "Add category" and show why. */
  isCreatable: boolean;
  totalRecords: number;
}

export type CategoryLevel = "category" | "subCategory" | "childCategory";

/** Add (no id) or edit (id) one node at any level. */
export interface SaveCategoryInput {
  level: CategoryLevel;
  /** Present = edit, absent = add. */
  id?: number;
  name: string;
  /** subCategory → its categoryId; childCategory → its subCategoryId; ignored for the top level. */
  parentId?: number;
}

export interface DeleteCategoryInput {
  level: CategoryLevel;
  id: number;
}

/** New order of the siblings at one level (all ids of that level under the same parent). */
export interface ReorderCategoriesInput {
  level: CategoryLevel;
  ids: number[];
}

/** Request bodies as the API expects them. */
export interface CategoryNameBody {
  name: string;
}
export interface SubCategoryBody {
  name: string;
  categoryId: number;
}
export interface ChildCategoryBody {
  name: string;
  subCategoryId: number;
}
export interface ReorderBody {
  ids: number[];
}
