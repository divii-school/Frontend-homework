import { z } from "zod";
import { apiRequest, request } from "@/services/http";
import type { CategoryLevel, CategoryNode } from "@/types/category";

/*
 * GET /api/v1/product-category/list?search=… returns the whole 3-level tree (no paging/sort params).
 * TODO(HW3): the OpenAPI spec has no response schema and the QA server was down when this was written.
 * The child-list key names below are a best guess; confirm against a real response and drop the extras.
 */
const CHILD_KEYS = ["subCategories", "subcategories", "childCategories", "children", "subSubCategories"] as const;

interface RawNode {
  id: number;
  name: string;
  subCategories?: RawNode[];
  subcategories?: RawNode[];
  childCategories?: RawNode[];
  children?: RawNode[];
  subSubCategories?: RawNode[];
}

const rawNodeSchema: z.ZodType<RawNode> = z.lazy(() =>
  z
    .object({
      id: z.coerce.number(),
      name: z.string(),
      subCategories: z.array(rawNodeSchema).optional(),
      subcategories: z.array(rawNodeSchema).optional(),
      childCategories: z.array(rawNodeSchema).optional(),
      children: z.array(rawNodeSchema).optional(),
      subSubCategories: z.array(rawNodeSchema).optional(),
    })
    .passthrough(),
);

const listSchema = z.union([z.array(rawNodeSchema), z.object({ list: z.array(rawNodeSchema) }).transform((d) => d.list)]);

function toNode(raw: RawNode, level: CategoryLevel, parentId: number | null): CategoryNode {
  const kids = CHILD_KEYS.map((key) => raw[key]).find((value) => Array.isArray(value)) ?? [];
  return {
    id: raw.id,
    name: raw.name,
    level,
    parentId,
    children: level < 3 ? kids.map((kid) => toNode(kid, (level + 1) as CategoryLevel, raw.id)) : [],
  };
}

/** Each level has its own endpoints; the parent id goes in a level-specific field. */
const ENDPOINTS: Record<CategoryLevel, { base: string; parentField: "categoryId" | "subCategoryId" | null }> = {
  1: { base: "/api/v1/product-category", parentField: null },
  2: { base: "/api/v1/product-category/subcategory", parentField: "categoryId" },
  3: { base: "/api/v1/product-category/subcategory-child", parentField: "subCategoryId" },
};

function bodyFor(level: CategoryLevel, name: string, parentId: number | null): Record<string, string | number> {
  const { parentField } = ENDPOINTS[level];
  if (parentField === null) return { name };
  if (parentId === null) throw new Error(`A level-${level} category needs a parent.`);
  return { name, [parentField]: parentId };
}

export interface CategoryInput {
  level: CategoryLevel;
  name: string;
  parentId: number | null;
}

export const productCategoryService = {
  async list(search: string, signal?: AbortSignal): Promise<CategoryNode[]> {
    const data = await apiRequest<unknown>("/api/v1/product-category/list", {
      query: { search: search.trim() || undefined },
      signal,
    });
    return listSchema.parse(data).map((node) => toNode(node, 1, null));
  },

  async create({ level, name, parentId }: CategoryInput): Promise<void> {
    await request<unknown>(`${ENDPOINTS[level].base}/add`, { method: "POST", body: bodyFor(level, name.trim(), parentId) });
  },

  async update(id: number, { level, name, parentId }: CategoryInput): Promise<void> {
    await request<unknown>(`${ENDPOINTS[level].base}/edit/${id}`, { method: "PUT", body: bodyFor(level, name.trim(), parentId) });
  },

  async remove(id: number, level: CategoryLevel): Promise<void> {
    await request<unknown>(`${ENDPOINTS[level].base}/delete/${id}`, { method: "DELETE" });
  },
};
