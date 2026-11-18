import { SUPER_ADMIN_ROLE } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import type { AuthUser } from "@/types/auth";
import { grantedKeys } from "@/utils/permissions";

/**
 * ONE config for the menu, the route guard and the button permissions.
 * - Sidebar draws the NAV_ITEMS the user may open.
 * - RouteGuard finds the item for the current URL and shows the 403 page when the user may not open it.
 * - Buttons ask canDo(user, action).
 * A new page is added here once and all three follow.
 */

/** Permission keys exactly as GET /permissions/list returns them (module "shopping_mall"). */
export const PERMISSION_KEYS = {
  products: "product_management",
  categories: "category_management",
} as const;
type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export interface NavItem {
  key: string;
  label: string;
  /** Every URL that starts with this path belongs to the item. */
  path: string;
  permission: PermissionKey;
}

export const NAV_GROUP_LABEL = "쇼핑몰 관리";

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "products", label: "상품 관리", path: ROUTES.products, permission: PERMISSION_KEYS.products },
  { key: "categories", label: "상품 카테고리 관리", path: ROUTES.categories, permission: PERMISSION_KEYS.categories },
];

/**
 * The rest of the Talking Club admin menu, as the Figma frames draw it. HW3 builds only the two shopping pages, so
 * these are shown greyed out and cannot be opened (design review of 18 Nov, design question Q14).
 */
export interface OutsideMenu {
  label: string;
  icon: string;
}
export const MENUS_BEFORE_SHOPPING: readonly OutsideMenu[] = [
  { label: "대시보드", icon: "pi-th-large" },
  { label: "유저관리", icon: "pi-users" },
  { label: "학원 관리", icon: "pi-building" },
  { label: "학사관리", icon: "pi-book" },
  { label: "교육과정 관리", icon: "pi-file" },
];
export const MENUS_AFTER_SHOPPING: readonly OutsideMenu[] = [
  { label: "공지사항 관리", icon: "pi-megaphone" },
  { label: "결제 관리", icon: "pi-credit-card" },
  { label: "지사장 메뉴", icon: "pi-id-card" },
  { label: "권한 관리", icon: "pi-key" },
];
/** Shopping pages outside HW3, drawn greyed out under 쇼핑몰 관리. */
export const OTHER_SHOPPING_PAGES: readonly string[] = ["주문 배송 관리", "적립금 관리"];

export type ActionKey = "product.write" | "product.delete" | "category.write" | "category.delete";

/**
 * Every action follows its page permission only. Nothing in the design or the API limits deleting to certain
 * roles, so no role list is invented here (the API has MASTER_ADMIN and GENERAL_ADMIN admins; see A11).
 */
const ACTIONS: Record<ActionKey, { permission: PermissionKey }> = {
  "product.write": { permission: PERMISSION_KEYS.products },
  "product.delete": { permission: PERMISSION_KEYS.products },
  "category.write": { permission: PERMISSION_KEYS.categories },
  "category.delete": { permission: PERMISSION_KEYS.categories },
};

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === SUPER_ADMIN_ROLE) return true;
  return grantedKeys(user.permissions).has(permission);
}

/** The menu item a URL belongs to; undefined for pages outside the menu (they need only a login). */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}

export function canOpen(user: AuthUser | null, pathname: string): boolean {
  const item = findNavItem(pathname);
  return item ? hasPermission(user, item.permission) : user !== null;
}

export function canDo(user: AuthUser | null, action: ActionKey): boolean {
  return hasPermission(user, ACTIONS[action].permission);
}

export const visibleNavItems = (user: AuthUser | null): NavItem[] =>
  NAV_ITEMS.filter((item) => hasPermission(user, item.permission));
