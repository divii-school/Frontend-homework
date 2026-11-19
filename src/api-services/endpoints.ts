// Every API path this app calls, relative to NEXT_PUBLIC_API_BASE_URL (…/api/v1).
// Source: talking-club-backend release/qa — controllers under src/modules/{auth,product-categories,products,utils}/v1.

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login", // POST { loginId, password } → data { token, user }
    LOGOUT: "/auth/logout", // GET (Bearer)
  },
  PRODUCT_CATEGORY: {
    LIST: "/product-category/list", // GET ?search= → data Category[] (tree), isCreatable
    ADD: "/product-category/add", // POST { name }
    EDIT: (id: number) => `/product-category/edit/${id}`, // PUT { name }
    DELETE: (id: number) => `/product-category/delete/${id}`,
    SUB_ADD: "/product-category/subcategory/add", // POST { name, categoryId }
    SUB_EDIT: (id: number) => `/product-category/subcategory/edit/${id}`, // PUT { name, categoryId }
    SUB_DELETE: (id: number) => `/product-category/subcategory/delete/${id}`,
    CHILD_ADD: "/product-category/subcategory-child/add", // POST { name, subCategoryId }
    CHILD_EDIT: (id: number) => `/product-category/subcategory-child/edit/${id}`, // PUT { name, subCategoryId }
    CHILD_DELETE: (id: number) => `/product-category/subcategory-child/delete/${id}`,
    REORDER: "/product-category/reorder-categories", // PUT { ids } (new order)
    SUB_REORDER: "/product-category/reorder-subcategories",
    CHILD_REORDER: "/product-category/reorder-subsubcategories",
  },
  PRODUCTS: {
    LIST: "/products", // GET ?page&limit&type=productName|categoryName&search  (list B)
    BY_CATEGORY: "/products/get-products-by-category", // GET ?page&limit&search&categoryId&subCategoryId&childCategoryId&productType (list A)
    DETAILS: (id: number) => `/products/details/${id}`,
    ADD: "/products/add",
    EDIT: (id: number) => `/products/edit/${id}`,
    DELETE: "/products/delete", // DELETE { ids }
    UPDATE_STATUS: (id: number, status: "yes" | "no") => `/products/update-status/${id}/${status}`,
    GENERATE_CODE: "/products/generate-code",
    CHECK_ERP_CODE: "/products/missing-erp-codes", // GET ?erpCode= → erpCodeAvailable | 400 erpCodeAlreadyExists
    PICKER_CATEGORIES: "/products/categories",
    PICKER_SUBCATEGORIES: (categoryId: number) => `/products/subcategories/${categoryId}`,
    PICKER_CHILDCATEGORIES: (subCategoryId: number) => `/products/childcategories/${subCategoryId}`,
  },
  UTILS: {
    UPLOAD_URLS: "/utils/upload-file-urls", // POST { location, extension, count, fileName } → data.urls[]
  },
} as const;
