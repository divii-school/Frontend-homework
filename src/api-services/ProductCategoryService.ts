import { apiClient } from "./CoreAPIService";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiEnvelope } from "@/types/api";
import type {
  Category,
  CategoryLevel,
  CategoryNameBody,
  CategoryTree,
  ChildCategoryBody,
  DeleteCategoryInput,
  ReorderBody,
  ReorderCategoriesInput,
  SaveCategoryInput,
  SubCategory,
  SubCategoryBody,
} from "./ProductCategoryService.types";

// Every product-category endpoint (talking-club-backend release/qa,
// src/modules/product-categories/v1/category.controller.ts). No server paging or sort for the tree:
// `search` is server-side, order = sortOrder (changed by the reorder endpoints).
// Mutations return the envelope so screens can toast `getApiMessage(res.message)`.

type Envelope = ApiEnvelope<null>;

const bySortOrder = <T extends { sortOrder: number; id: number }>(a: T, b: T) => a.sortOrder - b.sortOrder || a.id - b.id;

/** Sorts the middle and minor levels (the server only sorts the top level). */
function normaliseTree(categories: Category[]): Category[] {
  return [...categories].sort(bySortOrder).map((category) => ({
    ...category,
    subCategories: [...(category.subCategories ?? [])].sort(bySortOrder).map(
      (sub): SubCategory => ({
        ...sub,
        childCategories: [...(sub.childCategories ?? [])].sort(bySortOrder),
      }),
    ),
  }));
}

function requireParent(input: SaveCategoryInput): number {
  if (typeof input.parentId !== "number") {
    throw new Error(`parentId is required to save a ${input.level}`);
  }
  return input.parentId;
}

const ProductCategoryService = {
  /** GET /product-category/list?search= → the whole tree (max 3 top-level categories). */
  async getTree(search?: string, signal?: AbortSignal): Promise<CategoryTree> {
    const res = await apiClient.get<Category[]>(API_ENDPOINTS.PRODUCT_CATEGORY.LIST, { search: search?.trim() }, { signal });
    return {
      categories: normaliseTree(res.data ?? []),
      isCreatable: res.isCreatable !== false,
      totalRecords: res.totalRecords ?? res.data?.length ?? 0,
    };
  },

  // ---- Top level -------------------------------------------------------------------------------
  addCategory(name: string): Promise<Envelope> {
    return apiClient.post<null, CategoryNameBody>(API_ENDPOINTS.PRODUCT_CATEGORY.ADD, { name });
  },
  editCategory(id: number, name: string): Promise<Envelope> {
    return apiClient.put<null, CategoryNameBody>(API_ENDPOINTS.PRODUCT_CATEGORY.EDIT(id), { name });
  },
  deleteCategory(id: number): Promise<Envelope> {
    return apiClient.delete<null>(API_ENDPOINTS.PRODUCT_CATEGORY.DELETE(id));
  },

  // ---- Middle level ----------------------------------------------------------------------------
  addSubCategory(name: string, categoryId: number): Promise<Envelope> {
    return apiClient.post<null, SubCategoryBody>(API_ENDPOINTS.PRODUCT_CATEGORY.SUB_ADD, { name, categoryId });
  },
  editSubCategory(id: number, name: string, categoryId: number): Promise<Envelope> {
    return apiClient.put<null, SubCategoryBody>(API_ENDPOINTS.PRODUCT_CATEGORY.SUB_EDIT(id), { name, categoryId });
  },
  deleteSubCategory(id: number): Promise<Envelope> {
    return apiClient.delete<null>(API_ENDPOINTS.PRODUCT_CATEGORY.SUB_DELETE(id));
  },

  // ---- Minor level -----------------------------------------------------------------------------
  addChildCategory(name: string, subCategoryId: number): Promise<Envelope> {
    return apiClient.post<null, ChildCategoryBody>(API_ENDPOINTS.PRODUCT_CATEGORY.CHILD_ADD, { name, subCategoryId });
  },
  editChildCategory(id: number, name: string, subCategoryId: number): Promise<Envelope> {
    return apiClient.put<null, ChildCategoryBody>(API_ENDPOINTS.PRODUCT_CATEGORY.CHILD_EDIT(id), { name, subCategoryId });
  },
  deleteChildCategory(id: number): Promise<Envelope> {
    return apiClient.delete<null>(API_ENDPOINTS.PRODUCT_CATEGORY.CHILD_DELETE(id));
  },

  // ---- Reorder (same level, ids in the new order) ----------------------------------------------
  reorder(level: CategoryLevel, ids: number[]): Promise<Envelope> {
    const url =
      level === "category"
        ? API_ENDPOINTS.PRODUCT_CATEGORY.REORDER
        : level === "subCategory"
          ? API_ENDPOINTS.PRODUCT_CATEGORY.SUB_REORDER
          : API_ENDPOINTS.PRODUCT_CATEGORY.CHILD_REORDER;
    return apiClient.put<null, ReorderBody>(url, { ids });
  },

  // ---- Level-generic helpers (what the hooks call) ---------------------------------------------
  /** Add (no id) or edit (id) at any level. The name is trimmed here, once. */
  save(input: SaveCategoryInput): Promise<Envelope> {
    const name = input.name.trim();
    if (input.level === "category") {
      return input.id ? ProductCategoryService.editCategory(input.id, name) : ProductCategoryService.addCategory(name);
    }
    const parentId = requireParent(input);
    if (input.level === "subCategory") {
      return input.id ? ProductCategoryService.editSubCategory(input.id, name, parentId) : ProductCategoryService.addSubCategory(name, parentId);
    }
    return input.id ? ProductCategoryService.editChildCategory(input.id, name, parentId) : ProductCategoryService.addChildCategory(name, parentId);
  },

  remove({ level, id }: DeleteCategoryInput): Promise<Envelope> {
    if (level === "category") return ProductCategoryService.deleteCategory(id);
    if (level === "subCategory") return ProductCategoryService.deleteSubCategory(id);
    return ProductCategoryService.deleteChildCategory(id);
  },

  reorderLevel({ level, ids }: ReorderCategoriesInput): Promise<Envelope> {
    return ProductCategoryService.reorder(level, ids);
  },
};

export default ProductCategoryService;
