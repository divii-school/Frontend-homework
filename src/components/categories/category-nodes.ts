import type { Category, CategoryLevel } from "@/api-services/ProductCategoryService.types";

// The API answers with three different shapes (Category → SubCategory → ChildCategory).
// The screen turns them into ONE shape (CategoryNodeData) so a single recursive component can
// draw every level, and every action (add / edit / delete / move) works the same way.

export interface CategoryNodeData {
  /** Unique across all levels: "category-67", "subCategory-72", "childCategory-536". */
  key: string;
  id: number;
  name: string;
  level: CategoryLevel;
  /** 1 = main, 2 = subcategory, 3 = minor category (the design allows 3 levels). */
  depth: 1 | 2 | 3;
  /** Id of the parent: a subcategory's categoryId, a minor category's subCategoryId. */
  parentId?: number;
  /** Key of the parent node (used to expand it after adding a child). */
  parentKey?: string;
  children: CategoryNodeData[];
}

interface LevelInfo {
  /** Small badge in front of the row. */
  badge: string;
  /** Used in dialog titles and messages: "Edit subcategory", "Delete minor category …". */
  noun: string;
  /** The level that can be added under this one; null = depth limit reached. */
  childLevel: CategoryLevel | null;
  /** Label of the purple add pill (design ⑦ / ⑧). */
  addLabel: string | null;
  /** Children counted in "(N subcategories)". */
  childSingular: string;
  childPlural: string;
}

export const LEVEL_INFO: Record<CategoryLevel, LevelInfo> = {
  category: {
    badge: "대분류",
    noun: "대분류",
    childLevel: "subCategory",
    addLabel: "중분류",
    childSingular: "중분류",
    childPlural: "중분류",
  },
  subCategory: {
    badge: "중분류",
    noun: "중분류",
    childLevel: "childCategory",
    addLabel: "소분류",
    childSingular: "소분류",
    childPlural: "소분류",
  },
  childCategory: {
    badge: "소분류",
    noun: "소분류",
    childLevel: null,
    addLabel: null,
    childSingular: "",
    childPlural: "",
  },
};

export const nodeKey = (level: CategoryLevel, id: number) => `${level}-${id}`;

/** API tree → one node shape for all three levels (the service already sorted each level). */
export function toNodes(categories: Category[]): CategoryNodeData[] {
  return categories.map((category) => {
    const categoryKey = nodeKey("category", category.id);
    return {
      key: categoryKey,
      id: category.id,
      name: category.name,
      level: "category",
      depth: 1,
      children: category.subCategories.map((sub) => {
        const subKey = nodeKey("subCategory", sub.id);
        return {
          key: subKey,
          id: sub.id,
          name: sub.name,
          level: "subCategory",
          depth: 2,
          parentId: category.id,
          parentKey: categoryKey,
          children: sub.childCategories.map((child) => ({
            key: nodeKey("childCategory", child.id),
            id: child.id,
            name: child.name,
            level: "childCategory",
            depth: 3,
            parentId: sub.id,
            parentKey: subKey,
            children: [],
          })),
        };
      }),
    };
  });
}

/** "[72] Phonics & Alphabet" — the design shows [code] name; the API has no code, so the id is used. */
export const nodeLabel = (node: Pick<CategoryNodeData, "id" | "name">) => `[${node.id}] ${node.name}`;

/** "(2 subcategories)" / "(1 minor category)"; null on the minor level (it has no children). */
export function countLabel(node: CategoryNodeData): string | null {
  const info = LEVEL_INFO[node.level];
  if (!info.childLevel) return null;
  const count = node.children.length;
  return `(${count}개 ${info.childSingular})`;
}

/** Keys of every node that has children — "Collapse all" collapses exactly these. */
export function keysWithChildren(nodes: CategoryNodeData[]): string[] {
  return nodes.flatMap((node) => (node.children.length > 0 ? [node.key, ...keysWithChildren(node.children)] : []));
}

/** Copy of `items` with the item at `from` moved to `to` (drag-and-drop / Alt+arrow). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
