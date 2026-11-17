import type { AuthUser, PermissionRow, Role } from "@/types/auth";

// =====================================================================================
// ONE config for the sidebar menu, the route guards (middleware + RouteGuard) and the
// button permissions. Adding a page = adding one entry here.
//
// Who may open what (Figma 8.1.0 / 8.2.0 + docs/hw3-plan.md):
//  - Product Management          → SUPER_ADMIN, MASTER_ADMIN, GENERAL_ADMIN
//  - Product Category Management → SUPER_ADMIN, MASTER_ADMIN (MASTER treated like SUPER)
//  - GENERAL_ADMIN additionally needs the sub-module in `user.permissions`
//    (module `shopping_mall`, sub-modules `product_management` / `category_management` — the real
//    keys from talking-club-admin-frontend src/utils/constants.ts and the backend PERMISSION_STRUCTURE).
//  - Every other role (REGIONAL_MANAGER, PRINCIPAL, TEACHER, STUDENT, GUARDIAN) has no access.
//
// Menus of the real admin that are not part of HW3 are listed with `disabled: true`: they show
// greyed out (same look as the design) and are never links or routes.
// =====================================================================================

export type PermissionAction = "read" | "create" | "update" | "delete";

export interface NavPermission {
  module: string;
  subModule: string;
}

/** A page below an entry's href and the action it needs (e.g. /create needs 'create'). */
export interface NavSubRoute {
  segment: string;
  action: PermissionAction;
}

export interface NavItem {
  key: string;
  label: string;
  /** Leaf pages only. Groups and disabled items have none. */
  href?: string;
  /** PrimeIcons class, e.g. "pi pi-shopping-bag" (top level only). */
  icon?: string;
  roles: readonly Role[];
  permission?: NavPermission;
  subRoutes?: readonly NavSubRoute[];
  /** Exists in the real admin, not in this app: shown greyed, never clickable. */
  disabled?: boolean;
  children?: readonly NavItem[];
}

export const HQ_ADMIN_ROLES: readonly Role[] = ["SUPER_ADMIN", "MASTER_ADMIN", "GENERAL_ADMIN"];
const SUPER_ROLES: readonly Role[] = ["SUPER_ADMIN", "MASTER_ADMIN"];

export const PERMISSION_KEYS = {
  SHOPPING_MALL: "shopping_mall",
  PRODUCT_MANAGEMENT: "product_management",
  CATEGORY_MANAGEMENT: "category_management",
} as const;

/** Keys screens pass to canDo() / useCan(). */
export const ROUTE_KEYS = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
} as const;

export type RouteKey = (typeof ROUTE_KEYS)[keyof typeof ROUTE_KEYS];

export const DEFAULT_HOME = "/shopping-mall/products";

export const NAVIGATION: readonly NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "pi pi-th-large", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "user-management", label: "User Management", icon: "pi pi-users", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "academy-management", label: "Academy Management", icon: "pi pi-building", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "academic-management", label: "Academic Management", icon: "pi pi-book", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "curriculum-management", label: "Curriculum Management", icon: "pi pi-folder", roles: HQ_ADMIN_ROLES, disabled: true },
  {
    key: "shopping-mall",
    label: "Shopping Mall Management",
    icon: "pi pi-shopping-bag",
    roles: HQ_ADMIN_ROLES,
    children: [
      {
        key: ROUTE_KEYS.PRODUCTS,
        label: "Product Management",
        href: "/shopping-mall/products",
        roles: HQ_ADMIN_ROLES,
        permission: { module: PERMISSION_KEYS.SHOPPING_MALL, subModule: PERMISSION_KEYS.PRODUCT_MANAGEMENT },
        subRoutes: [
          { segment: "create", action: "create" },
          { segment: "edit", action: "update" },
          { segment: "details", action: "read" },
        ],
      },
      {
        key: ROUTE_KEYS.CATEGORIES,
        label: "Product Category Management",
        href: "/shopping-mall/categories",
        roles: SUPER_ROLES,
        permission: { module: PERMISSION_KEYS.SHOPPING_MALL, subModule: PERMISSION_KEYS.CATEGORY_MANAGEMENT },
      },
      { key: "order-delivery", label: "Order Delivery Management", roles: HQ_ADMIN_ROLES, disabled: true },
      { key: "reward-points", label: "Reward Points Management", roles: HQ_ADMIN_ROLES, disabled: true },
    ],
  },
  { key: "notice-management", label: "Notice Management", icon: "pi pi-megaphone", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "payment-management", label: "Payment Management", icon: "pi pi-credit-card", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "branch-manager-menu", label: "Branch Manager Menu", icon: "pi pi-id-card", roles: HQ_ADMIN_ROLES, disabled: true },
  { key: "permission-management", label: "Permission Management", icon: "pi pi-key", roles: HQ_ADMIN_ROLES, disabled: true },
];

// ---- Lookups ---------------------------------------------------------------------------------

function flatten(items: readonly NavItem[], parents: NavItem[] = []): Array<{ item: NavItem; parents: NavItem[] }> {
  return items.flatMap((item) => [{ item, parents }, ...flatten(item.children ?? [], [...parents, item])]);
}

const FLAT_NAV = flatten(NAVIGATION);

/** Enabled leaf pages (the real routes of this app). */
const ROUTE_ITEMS = FLAT_NAV.filter(({ item }) => item.href && !item.disabled);

export function findNavItem(key: string): NavItem | undefined {
  return FLAT_NAV.find(({ item }) => item.key === key)?.item;
}

/** Breadcrumb for a page header: parents + the page itself (+ optional extra crumbs like "Edit"). */
export function getBreadcrumb(routeKey: RouteKey, ...extra: string[]): Array<{ label: string; href?: string }> {
  const entry = FLAT_NAV.find(({ item }) => item.key === routeKey);
  if (!entry) return extra.map((label) => ({ label }));
  return [
    ...entry.parents.map((parent) => ({ label: parent.label })),
    { label: entry.item.label, href: extra.length > 0 ? entry.item.href : undefined },
    ...extra.map((label) => ({ label })),
  ];
}

/**
 * Which nav entry + action a URL path belongs to; null for paths outside the menu.
 * The path is decoded first: the server also serves /shopping-mall/%63ategories as /shopping-mall/categories.
 * A path that cannot be decoded (e.g. "%E0") is compared as it is, like the server does.
 */
export function matchRoute(pathname: string): { item: NavItem; action: PermissionAction } | null {
  let raw = pathname.split(/[?#]/)[0];
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // malformed escape: keep the undecoded path
  }
  const path = raw.replace(/\/+$/, "") || "/";
  for (const { item } of ROUTE_ITEMS) {
    const href = item.href as string;
    if (path === href) return { item, action: "read" };
    if (path.startsWith(`${href}/`)) {
      const segment = path.slice(href.length + 1).split("/")[0];
      const sub = item.subRoutes?.find((route) => route.segment === segment);
      return { item, action: sub?.action ?? "read" };
    }
  }
  return null;
}

// ---- Permission checks ------------------------------------------------------------------------

export function isHqAdmin(user: Pick<AuthUser, "role"> | null | undefined): boolean {
  return !!user && (HQ_ADMIN_ROLES as readonly string[]).includes(user.role);
}

/**
 * GENERAL_ADMIN permission rows: the sub-module must be granted. A row without `actions`
 * (release/qa never sends them) allows every action; with `actions` (권한 관리 A-6):
 * read = view, create = register, update / delete = edit.
 */
function hasPermission(rows: PermissionRow[] | undefined, permission: NavPermission, action: PermissionAction): boolean {
  const row = (rows ?? []).find((candidate) => candidate.module === permission.module);
  if (!row || !Array.isArray(row.subModules) || !row.subModules.includes(permission.subModule)) return false;
  const flags = row.actions?.[permission.subModule];
  if (!flags) return true;
  const read = flags.view !== false;
  if (action === "read") return read;
  if (action === "create") return read && flags.register !== false;
  return read && flags.edit !== false;
}

/** Can this user do `action` on the page `routeKey`? Use for buttons: canDo(user, 'products', 'delete'). */
export function canDo(user: AuthUser | null | undefined, routeKey: string, action: PermissionAction = "read"): boolean {
  if (!user) return false;
  const item = findNavItem(routeKey);
  if (!item || item.disabled) return false;
  if (!(item.roles as readonly string[]).includes(user.role)) return false;
  if (user.role === "GENERAL_ADMIN" && item.permission) return hasPermission(user.permissions, item.permission, action);
  return true;
}

/** Can this user open this URL? Paths outside the menu (404s) are open to HQ admins only. */
export function canAccess(user: AuthUser | null | undefined, pathname: string): boolean {
  if (!user) return false;
  const route = matchRoute(pathname);
  if (!route) return isHqAdmin(user);
  return canDo(user, route.item.key, route.action);
}

/** The menu this user sees: allowed pages, greyed "not in HW3" items for admins, empty groups dropped. */
export function visibleMenu(user: AuthUser | null | undefined): NavItem[] {
  if (!user) return [];
  const filter = (items: readonly NavItem[]): NavItem[] =>
    items.flatMap((item): NavItem[] => {
      if (!(item.roles as readonly string[]).includes(user.role)) return [];
      if (item.disabled) return [item];
      if (item.children) {
        const children = filter(item.children);
        return children.some((child) => !child.disabled) ? [{ ...item, children }] : [];
      }
      return canDo(user, item.key, "read") ? [item] : [];
    });
  return filter(NAVIGATION);
}

/** First page this user may open (login default), or null when there is none. */
export function firstAccessibleHref(user: AuthUser | null | undefined): string | null {
  if (!user) return null;
  if (canAccess(user, DEFAULT_HOME)) return DEFAULT_HOME;
  const entry = ROUTE_ITEMS.find(({ item }) => canDo(user, item.key, "read"));
  return entry?.item.href ?? null;
}
