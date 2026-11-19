import type { ProductListQuery } from "@/api-services/ProductService.types";

// Every TanStack Query key in one place. Keys are hierarchical, so invalidating a prefix
// (e.g. queryKeys.products.lists()) refreshes every list variant at once.
//
// Who invalidates what (see the mutation hooks):
//  - category add / edit / delete / reorder → categories.all + products.pickers() (the form dropdowns)
//                                             + products.lists() (rows show category names)
//  - product add / edit / delete / status    → products.lists() + products.details(id)

export const queryKeys = {
  categories: {
    all: ["categories"] as const,
    tree: (search: string) => ["categories", "tree", { search }] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => ["products", "list"] as const,
    list: (query: ProductListQuery) => ["products", "list", query] as const,
    detailsAll: () => ["products", "details"] as const,
    details: (id: number) => ["products", "details", id] as const,
    generatedCode: () => ["products", "generate-code"] as const,
    pickers: () => ["products", "pickers"] as const,
    pickerCategories: () => ["products", "pickers", "categories"] as const,
    pickerSubCategories: (categoryId: number | null) => ["products", "pickers", "sub", categoryId] as const,
    pickerChildCategories: (subCategoryId: number | null) => ["products", "pickers", "child", subCategoryId] as const,
  },
} as const;
