export const ROUTES = {
  login: "/auth/login",
  home: "/products",
  products: "/products",
  productCreate: "/products/create",
  productDetails: (id: number | string) => `/products/${id}`,
  productEdit: (id: number | string) => `/products/${id}/edit`,
  categories: "/categories",
} as const;

/** Paths anyone may open without a session. Everything else is protected by middleware.ts. */
export const PUBLIC_PATHS: readonly string[] = [ROUTES.login];
