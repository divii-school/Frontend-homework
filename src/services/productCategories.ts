import { z } from "zod";
import { apiRequest, request } from "@/services/http";
import type { CategoryLevel, CategoryNode } from "@/types/category";

/*
 * GET /api/v1/product-category/list?search=… returns the whole 3-level tree (no paging/sort params).
 * Confirmed on the QA server (2026-11-16):
 *   data: [{ id, name, sortOrder, …, subCategories: [{ id, name, …, childCategories: [{ id, name, … }] }] }]
 */
interface RawNode {
  id: number;
  name: string;
  subCategories?: RawNode[];
  childCategories?: RawNode[];
}

const rawNodeSchema: z.ZodType<RawNode> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    subCategories: z.array(rawNodeSchema).optional(),
    childCategories: z.array(rawNodeSchema).optional(),
  }),
);

const listSchema = z.array(rawNodeSchema);

function toNode(raw: RawNode, level: CategoryLevel, parentId: number | null): CategoryNode {
  const kids = (level === 1 ? raw.subCategories : raw.childCategories) ?? [];
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
