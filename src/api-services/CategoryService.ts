import type { ApiEnvelope } from "@/types/api";
import type { Category, CategoryLevel, CategoryTreeResult } from "@/types/category";
import { apiClient } from "@/utils/api-client";
import { API_ENDPOINTS } from "@/utils/api-integration";

const ENDPOINTS = API_ENDPOINTS.categories;

/** The list answer carries one extra flag beside `data`. */
interface CategoryListEnvelope extends ApiEnvelope<Category[]> {
  isCreatable?: boolean;
}

/** The three category levels share one shape, so each write takes the level and picks the endpoint. */
const WRITE_ENDPOINTS: Record<
  CategoryLevel,
  { add: string; edit: (id: number) => string; remove: (id: number) => string; parentField: string | null }
> = {
  category: { add: ENDPOINTS.add, edit: ENDPOINTS.edit, remove: ENDPOINTS.delete, parentField: null },
  sub: { add: ENDPOINTS.subAdd, edit: ENDPOINTS.subEdit, remove: ENDPOINTS.subDelete, parentField: "categoryId" },
  child: { add: ENDPOINTS.childAdd, edit: ENDPOINTS.childEdit, remove: ENDPOINTS.childDelete, parentField: "subCategoryId" },
};

const body = (level: CategoryLevel, name: string, parentId?: number) => {
  const { parentField } = WRITE_ENDPOINTS[level];
  return parentField ? { name, [parentField]: parentId } : { name };
};

export const CategoryService = {
  /** The whole tree in one call. `search` is matched by the server on every level. */
  async tree(search: string): Promise<CategoryTreeResult> {
    const { data } = await apiClient.get<CategoryListEnvelope>(ENDPOINTS.list, { params: { search: search || undefined } });
    return { categories: data.data, canCreateTopLevel: data.isCreatable === true };
  },

  async create(level: CategoryLevel, name: string, parentId?: number): Promise<void> {
    await apiClient.post(WRITE_ENDPOINTS[level].add, body(level, name, parentId));
  },

  async update(level: CategoryLevel, id: number, name: string, parentId?: number): Promise<void> {
    await apiClient.put(WRITE_ENDPOINTS[level].edit(id), body(level, name, parentId));
  },

  async remove(level: CategoryLevel, id: number): Promise<void> {
    await apiClient.delete(WRITE_ENDPOINTS[level].remove(id));
  },
};
