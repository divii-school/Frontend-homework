export type CategoryLevel = 1 | 2 | 3;

export interface CategoryNode {
  id: number;
  name: string;
  level: CategoryLevel;
  parentId?: number;
  children: CategoryNode[];
}

export const LEVEL_LABEL: Record<CategoryLevel, string> = { 1: '대분류', 2: '중분류', 3: '소분류' };
export const NAME_MAX = 50;
