/** 1 = main category, 2 = subcategory, 3 = child (minor) category. The API allows 3 levels. */
export type CategoryLevel = 1 | 2 | 3;

export interface CategoryNode {
  id: number;
  name: string;
  level: CategoryLevel;
  children: CategoryNode[];
}
