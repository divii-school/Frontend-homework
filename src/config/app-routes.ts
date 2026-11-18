/**
 * THE one config for navigation and access.
 * The side menu, the route guard (middleware + client guard) and the
 * permission checks for buttons all read this file, so they cannot drift apart.
 * Add a page here and it gets a menu entry, protection and a permission check at once.
 */

/** Permission keys from GET /permissions/list (module `shopping_mall`). */
export const PERMISSIONS = {
  productManagement: { module: 'shopping_mall', subModule: 'product_management' },
  categoryManagement: { module: 'shopping_mall', subModule: 'category_management' },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export interface AppRoute {
  /** URL prefix. A route matches its own path and everything below it. */
  path: string;
  /** Text in the side menu and the page title. */
  label: string;
  /** Permission needed to open the route (and to see its menu entry). */
  permission: PermissionKey;
}

export interface MenuGroup {
  label: string;
  /** Icon file in /public/icons (drawn through a CSS mask so it follows the theme colour). */
  icon: string;
  routes: AppRoute[];
}

export const ROUTES = {
  login: '/login',
  home: '/shopping/products',
  categories: '/shopping/categories',
  products: '/shopping/products',
  productNew: '/shopping/products/new',
  productDetails: (id: number | string) => `/shopping/products/${id}`,
  productEdit: (id: number | string) => `/shopping/products/${id}/edit`,
} as const;

export const MENU: MenuGroup[] = [
  {
    label: '쇼핑몰 관리',
    icon: '/icons/icon-cart.svg',
    // Order as in the Figma side menu (8.1.0): 상품 관리, then 상품 카테고리 관리.
    routes: [
      { path: ROUTES.products, label: '상품 관리', permission: 'productManagement' },
      { path: ROUTES.categories, label: '상품 카테고리 관리', permission: 'categoryManagement' },
    ],
  },
];

/** Every protected route, flattened from the menu. */
export const PROTECTED_ROUTES: AppRoute[] = MENU.flatMap((group) => group.routes);

/** Pages anyone may open without logging in. */
export const PUBLIC_PATHS = [ROUTES.login] as const;

/** The protected route a URL belongs to, or undefined if it is not in the config. */
export function findRoute(pathname: string): AppRoute | undefined {
  return PROTECTED_ROUTES.filter((r) => pathname === r.path || pathname.startsWith(`${r.path}/`)).sort(
    (a, b) => b.path.length - a.path.length,
  )[0];
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
