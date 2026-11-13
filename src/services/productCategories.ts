import { z } from "zod";
import { apiRequest } from "@/services/http";
import type { CategoryLevel, CategoryNode } from "@/types/category";

/*
 * GET /api/v1/product-category/list?search=… returns the whole 3-level tree (no paging/sort params).
 * TODO(HW3): the OpenAPI spec has no response schema and the QA server was down when this was written.
 * The child-list key names below are a best guess; confirm against a real response and drop the extras.
 */
const CHILD_KEYS = ["subCategories", "subcategories", "childCategories", "children", "subSubCategories"] as const;

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

interface RawNode {
  id: number;
  name: string;
  subCategories?: RawNode[];
  subcategories?: RawNode[];
  childCategories?: RawNode[];
  children?: RawNode[];
  subSubCategories?: RawNode[];
}

const listSchema = z.union([z.array(rawNodeSchema), z.object({ list: z.array(rawNodeSchema) }).transform((d) => d.list)]);

function toNode(raw: RawNode, level: CategoryLevel): CategoryNode {
  const kids = CHILD_KEYS.map((key) => raw[key]).find((value) => Array.isArray(value)) ?? [];
  return {
    id: raw.id,
    name: raw.name,
    level,
    children: level < 3 ? kids.map((kid) => toNode(kid, (level + 1) as CategoryLevel)) : [],
  };
}

export const productCategoryService = {
  async list(search: string, signal?: AbortSignal): Promise<CategoryNode[]> {
    const data = await apiRequest<unknown>("/api/v1/product-category/list", {
      query: { search: search.trim() || undefined },
      signal,
    });
    return listSchema.parse(data).map((node) => toNode(node, 1));
  },
};
