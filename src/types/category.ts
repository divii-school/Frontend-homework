/** Third level (소분류). */
export interface ChildCategory {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Second level (중분류). */
export interface SubCategory extends ChildCategory {
  childCategories: ChildCategory[];
}

/** First level (대분류). */
export interface Category extends ChildCategory {
  subCategories: SubCategory[];
}

export type CategoryLevel = "category" | "sub" | "child";

/** A row of the cascading selects in the product form (GET /products/categories and friends). */
export interface CategoryOption {
  id: number;
  name: string;
}

/** Which node a dialog is working on. `parentId` is the level above (none for a top-level category). */
export interface CategoryTarget {
  level: CategoryLevel;
  id?: number;
  parentId?: number;
  name?: string;
}
