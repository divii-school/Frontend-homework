/** 1 = main category, 2 = subcategory, 3 = child (minor) category. The API allows 3 levels. */
export type CategoryLevel = 1 | 2 | 3;

export interface CategoryNode {
  id: number;
  name: string;
  level: CategoryLevel;
  /** Id of the parent node (null for main categories). Edit endpoints for levels 2–3 need it. */
  parentId: number | null;
  children: CategoryNode[];
}

/** Max name length; the API docs give none, so this is our limit (also trimmed, never empty). */
export const CATEGORY_NAME_MAX = 50;
