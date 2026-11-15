import type { ProductListParams } from "@/types/product";

/** Every endpoint path the app calls, relative to /api/v1. */
export const API_ENDPOINTS = {
  auth: { login: "/auth/login", logout: "/auth/logout", profile: "/admin/profile" },
  products: {
    list: "/products",
    byCategory: "/products/get-products-by-category",
    add: "/products/add",
    edit: (id: number) => `/products/edit/${id}`,
    details: (id: number) => `/products/details/${id}`,
    delete: "/products/delete",
    status: (id: number, visible: boolean) => `/products/update-status/${id}/${visible ? "yes" : "no"}`,
    generateCode: "/products/generate-code",
    categories: "/products/categories",
    subCategories: (id: number) => `/products/subcategories/${id}`,
    childCategories: (id: number) => `/products/childcategories/${id}`,
  },
  categories: {
    list: "/product-category/list",
    add: "/product-category/add",
    edit: (id: number) => `/product-category/edit/${id}`,
    delete: (id: number) => `/product-category/delete/${id}`,
    subAdd: "/product-category/subcategory/add",
    subEdit: (id: number) => `/product-category/subcategory/edit/${id}`,
    subDelete: (id: number) => `/product-category/subcategory/delete/${id}`,
    childAdd: "/product-category/subcategory-child/add",
    childEdit: (id: number) => `/product-category/subcategory-child/edit/${id}`,
    childDelete: (id: number) => `/product-category/subcategory-child/delete/${id}`,
  },
  upload: { signedUrls: "/utils/upload-file-urls" },
} as const;

/** TanStack Query keys. Invalidating `all` refreshes every list and details of that domain. */
export const QUERIES = {
  profile: ["profile"] as const,
  products: {
    all: ["products"] as const,
    list: (params: ProductListParams) => ["products", "list", params] as const,
    details: (id: number) => ["products", "details", id] as const,
    related: (childCategoryId: number) => ["products", "related", childCategoryId] as const,
    code: ["products", "code"] as const,
  },
  categories: {
    all: ["categories"] as const,
    tree: (search: string) => ["categories", "tree", search] as const,
    options: (level: string, parentId: number | null) => ["categories", "options", level, parentId] as const,
  },
};
